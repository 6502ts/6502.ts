declare module 'screenfull' {
    export const isFullscreen: boolean;
    export const element: Element;
    export const enabled: boolean;
    export const raw: IScreenfullRaw;
    export function request(elem?: Element): void;
    export function toggle(elem?: Element): void;
    export function exit(): void;

    interface IScreenfullRaw {
      requestFullscreen?: string;
      exitFullscreen?: string;
      fullscreenElement?: string;
      fullscreenEnabled?: string;
      fullscreenchange?: string;
      fullscreenerror?: string;
    }
}
