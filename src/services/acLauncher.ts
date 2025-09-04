import type { ACLauncherMessage, ACPlayerData } from '../types';

export class ACLauncherService {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 3000;
  private pingInterval: number | null = null;
  private isConnected = false;
  private pcIp: string;
  private port = 8090;
  private eventListeners: Map<string, Function[]> = new Map();

  constructor(pcIp: string) {
    this.pcIp = pcIp;
  }

  connect(): Promise<boolean> {
    return new Promise((resolve, reject) => {
      try {
        const wsUrl = `ws://${this.pcIp}:${this.port}`;
        console.log(`Connecting to AC Launcher at ${wsUrl}`);
        
        this.ws = new WebSocket(wsUrl);
        
        this.ws.onopen = () => {
          console.log(`Connected to AC Launcher at ${this.pcIp}`);
          this.isConnected = true;
          this.reconnectAttempts = 0;
          this.startPingInterval();
          this.emit('connected', { pcIp: this.pcIp });
          resolve(true);
        };
        
        this.ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            this.handleMessage(message);
          } catch (error) {
            console.error('Error parsing AC Launcher message:', error);
          }
        };
        
        this.ws.onclose = () => {
          console.log(`Disconnected from AC Launcher at ${this.pcIp}`);
          this.isConnected = false;
          this.stopPingInterval();
          this.emit('disconnected', { pcIp: this.pcIp });
          
          if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.scheduleReconnect();
          }
        };
        
        this.ws.onerror = (error) => {
          console.error(`AC Launcher connection error for ${this.pcIp}:`, error);
          this.emit('error', { pcIp: this.pcIp, error });
          reject(error);
        };
        
      } catch (error) {
        console.error('Failed to create WebSocket connection:', error);
        reject(error);
      }
    });
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.stopPingInterval();
    this.isConnected = false;
  }

  private scheduleReconnect() {
    this.reconnectAttempts++;
    console.log(`Scheduling reconnect attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts} for ${this.pcIp}`);
    
    setTimeout(() => {
      if (!this.isConnected) {
        this.connect().catch(console.error);
      }
    }, this.reconnectDelay * this.reconnectAttempts);
  }

  private startPingInterval() {
    this.pingInterval = setInterval(() => {
      this.sendMessage({ type: 'ping' });
    }, 30000); // Ping every 30 seconds
  }

  private stopPingInterval() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  private handleMessage(message: any) {
    console.log(`AC Launcher message from ${this.pcIp}:`, message);
    
    // Handle different message types
    switch (message.type) {
      case 'acactive':
        this.emit('gameStateChanged', { 
          pcIp: this.pcIp, 
          state: { acactive: true, acstopped: false, acsoftstopped: false } 
        });
        break;
      case 'acstopped':
        this.emit('gameStateChanged', { 
          pcIp: this.pcIp, 
          state: { acactive: false, acstopped: true, acsoftstopped: false } 
        });
        break;
      case 'acsoftstopped':
        this.emit('gameStateChanged', { 
          pcIp: this.pcIp, 
          state: { acactive: false, acstopped: false, acsoftstopped: true } 
        });
        break;
      case 'pong':
        // Handle ping response
        break;
      default:
        this.emit('message', { pcIp: this.pcIp, message });
    }
  }

  sendMessage(message: ACLauncherMessage): boolean {
    if (!this.isConnected || !this.ws) {
      console.warn(`Cannot send message to ${this.pcIp}: not connected`);
      return false;
    }

    try {
      this.ws.send(JSON.stringify(message));
      console.log(`Sent message to ${this.pcIp}:`, message);
      return true;
    } catch (error) {
      console.error(`Error sending message to ${this.pcIp}:`, error);
      return false;
    }
  }

  // AC Launcher specific methods
  setPlayer(playerName: string): boolean {
    return this.sendMessage({ type: 'setplayer', data: playerName });
  }

  setCar(carId: string): boolean {
    return this.sendMessage({ type: 'setcar', data: carId });
  }

  setTrack(trackId: string): boolean {
    return this.sendMessage({ type: 'settrack', data: trackId });
  }

  setDifficulty(difficulty: 'gamer' | 'racer' | 'pro'): boolean {
    return this.sendMessage({ type: 'setdiff', data: difficulty });
  }

  startRace(): boolean {
    return this.sendMessage({ type: 'start' });
  }

  checkACActive(): boolean {
    return this.sendMessage({ type: 'isacactive' });
  }

  // Setup a complete session
  async setupSession(playerData: ACPlayerData): Promise<boolean> {
    if (!this.isConnected) {
      console.warn(`Cannot setup session on ${this.pcIp}: not connected`);
      return false;
    }

    try {
      // Send player data in sequence
      this.setPlayer(playerData.name);
      await this.delay(100);
      
      if (playerData.carId) {
        this.setCar(playerData.carId);
        await this.delay(100);
      }
      
      if (playerData.trackId) {
        this.setTrack(playerData.trackId);
        await this.delay(100);
      }
      
      this.setDifficulty(playerData.difficulty);
      await this.delay(100);
      
      return true;
    } catch (error) {
      console.error(`Error setting up session on ${this.pcIp}:`, error);
      return false;
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Event system
  on(event: string, callback: Function) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(callback);
  }

  off(event: string, callback: Function) {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  private emit(event: string, data?: any) {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in event listener for ${event}:`, error);
        }
      });
    }
  }

  getConnectionStatus(): { connected: boolean; pcIp: string } {
    return {
      connected: this.isConnected,
      pcIp: this.pcIp
    };
  }
}

// AC Launcher Manager for handling multiple connections
export class ACLauncherManager {
  private launchers: Map<string, ACLauncherService> = new Map();
  private eventListeners: Map<string, Function[]> = new Map();

  addLauncher(pcIp: string): ACLauncherService {
    if (this.launchers.has(pcIp)) {
      return this.launchers.get(pcIp)!;
    }

    const launcher = new ACLauncherService(pcIp);
    
    // Forward events from individual launchers
    launcher.on('connected', (data: any) => this.emit('launcherConnected', data));
    launcher.on('disconnected', (data: any) => this.emit('launcherDisconnected', data));
    launcher.on('error', (data: any) => this.emit('launcherError', data));
    launcher.on('gameStateChanged', (data: any) => this.emit('gameStateChanged', data));
    launcher.on('message', (data: any) => this.emit('launcherMessage', data));
    
    this.launchers.set(pcIp, launcher);
    return launcher;
  }

  removeLauncher(pcIp: string) {
    const launcher = this.launchers.get(pcIp);
    if (launcher) {
      launcher.disconnect();
      this.launchers.delete(pcIp);
    }
  }

  getLauncher(pcIp: string): ACLauncherService | undefined {
    return this.launchers.get(pcIp);
  }

  async connectAll(): Promise<void> {
    const promises = Array.from(this.launchers.values()).map(launcher => 
      launcher.connect().catch(error => {
        console.error('Failed to connect launcher:', error);
        return false;
      })
    );
    
    await Promise.allSettled(promises);
  }

  disconnectAll() {
    this.launchers.forEach(launcher => launcher.disconnect());
  }

  getConnectionStatuses(): Array<{ connected: boolean; pcIp: string }> {
    return Array.from(this.launchers.values()).map(launcher => 
      launcher.getConnectionStatus()
    );
  }

  // Event system
  on(event: string, callback: Function) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(callback);
  }

  off(event: string, callback: Function) {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  private emit(event: string, data?: any) {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in event listener for ${event}:`, error);
        }
      });
    }
  }
}

// Global instance
export const acLauncherManager = new ACLauncherManager();