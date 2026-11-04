import {
  bootstrapCameraKit,
  createMediaStreamSource,
  Transform2D,
} from '@snap/camera-kit';

const LENS_ID = '10eddb96-572f-419b-a72f-5ddb3bbd81cf';
const LENS_GROUP_ID = '5f7af386-e72c-4e1c-be93-397d220579bf';

(async function () {
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

    const session = await cameraKit.createSession({ liveRenderTarget });
    session.events.addEventListener('error', (event) => {
      console.error('[CK] session error:', event.detail.error);
    });
    console.log('[CK] session OK');

    const mediaStream = await navigator.mediaDevices.getUserMedia({
      video: true,
    });
    const source = createMediaStreamSource(mediaStream, {
      transform: Transform2D.MirrorX,
      cameraType: 'user',
    });
    await session.setSource(source);
    console.log('[CK] camera source OK');

    const lens = await cameraKit.lensRepository.loadLens(LENS_ID, LENS_GROUP_ID);
    console.log('[CK] lens loaded:', lens?.name ?? lens?.id ?? lens);

    await session.applyLens(lens);
    console.log('[CK] lens applied');

    await session.play();
    console.log('[CK] play started — if you only see camera with no effect, check session errors above');
  } catch (error) {
    console.error('[CK] failed:', error);
  }
})();
