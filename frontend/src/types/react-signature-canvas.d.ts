declare module 'react-signature-canvas' {
  import { Component } from 'react';

  interface SignatureCanvasProps {
    velocityFilterWeight?: number;
    minWidth?: number;
    maxWidth?: number;
    throttle?: number;
    minDistance?: number;
    backgroundColor?: string;
    penColor?: string;
    canvasProps?: React.CanvasHTMLAttributes<HTMLCanvasElement>;
    clearOnResize?: boolean;
    onBegin?: (event: MouseEvent | Touch) => void;
    onEnd?: () => void;
  }

  export default class SignatureCanvas extends Component<SignatureCanvasProps> {
    clear(): void;
    isEmpty(): boolean;
    fromDataURL(dataUrl: string, options?: any): void;
    toDataURL(type?: string, encoderOptions?: number): string;
    fromData(pointGroups: any[]): void;
    toData(): any[];
    off(): void;
    on(): void;
    getCanvas(): HTMLCanvasElement;
    getTrimmedCanvas(): HTMLCanvasElement;
  }
}
