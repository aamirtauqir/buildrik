type PreviewProps = Record<string, unknown>;
type Listener = (id: string | null) => void;

export class PreviewLayer {
  private map: Map<string, PreviewProps> = new Map();
  private listeners: Set<Listener> = new Set();

  set(id: string, props: PreviewProps): void {
    this.map.set(id, props);
    this.emit(id);
  }

  get(id: string): PreviewProps | undefined {
    return this.map.get(id);
  }

  has(id: string): boolean {
    return this.map.has(id);
  }

  clear(id: string): void {
    if (!this.map.has(id)) return;
    this.map.delete(id);
    this.emit(id);
  }

  clearAll(): void {
    this.map.clear();
    this.emit(null);
  }

  on(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private emit(id: string | null): void {
    for (const listener of this.listeners) listener(id);
  }
}
