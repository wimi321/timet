import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App';
import { I18nProvider } from './i18n';
import { createMockBeaconBridge } from './lib/mockBridge';

const cameraPluginState = vi.hoisted(() => ({
  getPhotoMock: vi.fn(async () => ({ base64String: 'ZmFrZS1pbWFnZS1ieXRlcw==' })),
  reset() {
    this.getPhotoMock.mockReset();
    this.getPhotoMock.mockResolvedValue({ base64String: 'ZmFrZS1pbWFnZS1ieXRlcw==' });
  },
}));

const appPluginState = vi.hoisted(() => {
  let nativePlatform = false;
  let platform = 'web';
  let exitAppCalls = 0;

  return {
    get exitAppCalls() {
      return exitAppCalls;
    },
    get platform() {
      return platform;
    },
    isNativePlatform() {
      return nativePlatform;
    },
    recordExitApp() {
      exitAppCalls += 1;
    },
    reset() {
      nativePlatform = false;
      platform = 'web';
      exitAppCalls = 0;
    },
    setPlatform(nextPlatform: string, nextNativePlatform = true) {
      platform = nextPlatform;
      nativePlatform = nextNativePlatform;
    },
  };
});

vi.mock('@capacitor/core', async () => {
  const actual = await vi.importActual<typeof import('@capacitor/core')>('@capacitor/core');

  return {
    ...actual,
    Capacitor: {
      ...actual.Capacitor,
      getPlatform: () => appPluginState.platform,
      isNativePlatform: () => appPluginState.isNativePlatform(),
    },
  };
});

vi.mock('@capacitor/camera', () => ({
  Camera: {
    getPhoto: cameraPluginState.getPhotoMock,
  },
  CameraResultType: {
    Base64: 'base64',
  },
  CameraSource: {
    Camera: 'camera',
    Prompt: 'prompt',
    Photos: 'photos',
  },
}));

vi.mock('@capacitor/app', () => ({
  App: {
    addListener: vi.fn(async () => ({
      remove: vi.fn(async () => undefined),
    })),
    exitApp: vi.fn(async () => {
      appPluginState.recordExitApp();
    }),
  },
}));

function renderApp(locale = 'zh-CN') {
  window.localStorage.setItem('timet_locale', locale);
  window.beaconBridge = createMockBeaconBridge();
  return render(
    <I18nProvider>
      <App />
    </I18nProvider>,
  );
}

function findMarkdownMessageContaining(text: string) {
  return screen.findByText(
    (_content, node) =>
      node instanceof HTMLElement
      && node.classList.contains('message-markdown')
      && (node.textContent?.includes(text) ?? false),
    undefined,
    { timeout: 5000 },
  );
}

describe('App', () => {
  beforeEach(() => {
    appPluginState.reset();
    cameraPluginState.reset();
    window.beaconBridge = undefined;
    window.localStorage.clear();
  });

  it('renders Timet home in Chinese without any SOS button', async () => {
    renderApp('zh-CN');

    expect(await screen.findByRole('heading', { name: /报上时代/ })).toBeInTheDocument();
    expect(screen.getByText(/提问公式：时代 \+ 地点 \+ 身份 \+ 资源 \+ 目标/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /首富线/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /上位线/ })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /sos/i })).not.toBeInTheDocument();
  });

  it('renders English home copy for English users', async () => {
    renderApp('en');

    expect(await screen.findByRole('heading', { name: /Name the era/i })).toBeInTheDocument();
    expect(screen.getByText(/Prompt formula: era \+ place \+ identity \+ resources \+ goal/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Fortune Line/i })).toBeInTheDocument();
  });

  it('runs a route quick action and returns the five-section strategist answer', async () => {
    renderApp('zh-CN');

    fireEvent.click(await screen.findByRole('button', { name: /首富线/ }));

    const strategistAnswer = await findMarkdownMessageContaining('你下一句该问什么');

    await waitFor(() => {
      expect(screen.queryByText(/正在推演路线/)).not.toBeInTheDocument();
    }, { timeout: 5000 });
    expect(strategistAnswer).toHaveTextContent('局面判断');
    expect(strategistAnswer).toHaveTextContent('先走三步');
    expect(strategistAnswer).toHaveTextContent('发财 / 上位主路径');
    expect(strategistAnswer).toHaveTextContent('绝不能暴露的事');
    expect(strategistAnswer).toHaveTextContent('你下一句该问什么');
  });

  it('asks for missing era and place instead of inventing context', async () => {
    renderApp('zh-CN');

    fireEvent.change(await screen.findByPlaceholderText(/例如：我在北宋汴京/), {
      target: { value: '我想发财，先给我路线。' },
    });
    fireEvent.click(screen.getByRole('button', { name: /发问/ }));

    const clarifier = await findMarkdownMessageContaining('先给我首富线/上位线');

    await waitFor(() => {
      expect(screen.queryByText(/正在推演路线/)).not.toBeInTheDocument();
    }, { timeout: 5000 });
    expect(clarifier).toHaveTextContent('你还没把时代和地点说清');
    expect(clarifier).toHaveTextContent('我在___');
    expect(clarifier).toHaveTextContent('地点___');
    expect(clarifier).toHaveTextContent('目标是___');
    expect(clarifier).toHaveTextContent('先给我首富线/上位线');
  }, 10000);

  it('opens the settings panel and shows the loaded local model', async () => {
    renderApp('zh-CN');

    fireEvent.click(await screen.findByRole('button', { name: /设置与模型/ }));

    await waitFor(() => {
      expect(screen.getByText('Gemma 4 E2B')).toBeInTheDocument();
    });
    expect(screen.getAllByText(/已加载/).length).toBeGreaterThan(0);
  });
});
