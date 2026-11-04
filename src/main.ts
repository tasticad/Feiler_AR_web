import {
  bootstrapCameraKit,
  createMediaStreamSource,
  Transform2D,
  type CameraKitSession,
  type CameraKitSource,
} from '@snap/camera-kit';

const LENS_ID = '10eddb96-572f-419b-a72f-5ddb3bbd81cf';
const LENS_GROUP_ID = '5f7af386-e72c-4e1c-be93-397d220579bf';

type CameraFacing = 'user' | 'environment';

let currentFacing: CameraFacing = 'environment';
let currentStream: MediaStream | null = null;
let session: CameraKitSession;

function stopStream(stream: MediaStream | null) {
  stream?.getTracks().forEach((track) => track.stop());
}

async function setCamera(facing: CameraFacing) {
  const stream = await navigator.mediaDevices.getUserMedia({
    video: {
      facingMode: { ideal: facing },
    },
    audio: false,
  });

  // Important: create a new CameraKitSource each time — sources can't be reused after setSource().
  const source: CameraKitSource = createMediaStreamSource(stream, {
    cameraType: facing,
    // Mirror only the selfie camera; rear camera should not be mirrored.
    transform: facing === 'user' ? Transform2D.MirrorX : undefined,
  });

  await session.setSource(source);
  stopStream(currentStream);
  currentStream = stream;
  currentFacing = facing;

  const button = document.getElementById('switch-camera');
  if (button) {
    button.textContent =
      facing === 'user' ? 'Use back camera' : 'Use front camera';
  }
}

(async function () {
  const switchButton = document.getElementById(
    'switch-camera'
  ) as HTMLButtonElement | null;

  try {
    console.log('[CK] origin:', location.origin);

    const cameraKit = await bootstrapCameraKit({
      apiToken:
        'eyJhbGciOiJIUzI1NiIsImtpZCI6IkNhbnZhc1MyU0hNQUNQcm9kIiwidHlwIjoiSldUIn0.eyJhdWQiOiJjYW52YXMtY2FudmFzYXBpIiwiaXNzIjoiY2FudmFzLXMyc3Rva2VuIiwibmJmIjoxNzkzNzE1MzA3LCJzdWIiOiJhZGNmY2E3OS0xMzgyLTQzZDktYWI0Yy1mYWQyZDM3ZDJkY2J-U1RBR0lOR344MjczYjBmNC03MTlmLTQzNDItODRkOS0zZDBhMWEzYWNkM2UifQ.-6FHfBHTYoiQo5fDabHSUFFnJLtfmLxmB_2HLKmIdAk',
      logger: 'console',
    });
    console.log('[CK] bootstrap OK');

    const liveRenderTarget = document.getElementById(
      'canvas'
    ) as HTMLCanvasElement;
    if (!liveRenderTarget) {
      throw new Error('Missing #canvas element');
    }

    session = await cameraKit.createSession({ liveRenderTarget });
    session.events.addEventListener('error', (event) => {
      console.error('[CK] session error:', event.detail.error);
    });
    console.log('[CK] session OK');

    await setCamera(currentFacing);
    console.log('[CK] camera source OK:', currentFacing);

    const lens = await cameraKit.lensRepository.loadLens(LENS_ID, LENS_GROUP_ID);
    console.log('[CK] lens loaded:', lens?.name ?? lens?.id ?? lens);

    await session.applyLens(lens);
    console.log('[CK] lens applied');

    await session.play();
    console.log('[CK] play started');

    switchButton?.addEventListener('click', async () => {
      if (!switchButton) return;
      switchButton.disabled = true;
      try {
        const nextFacing: CameraFacing =
          currentFacing === 'user' ? 'environment' : 'user';
        await setCamera(nextFacing);
        console.log('[CK] switched camera:', nextFacing);
      } catch (error) {
        console.error('[CK] camera switch failed:', error);
      } finally {
        switchButton.disabled = false;
      }
    });
  } catch (error) {
    console.error('[CK] failed:', error);
    if (switchButton) switchButton.disabled = true;
  }
})();
