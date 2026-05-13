/**
 * Server-Sent Events Manager for realtime updates
 */
class SSEManager {
  constructor() {
    this.clients = new Map(); // Map of clientId -> response object
    this.clientCounter = 0;
  }

  /**
   * Add a new SSE client
   */
  addClient(req, res) {
    const clientId = ++this.clientCounter;

    // Set SSE headers
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': process.env.FRONTEND_URL || '*',
      'X-Accel-Buffering': 'no' // Disable nginx buffering
    });

    // Send initial connection message
    res.write(`data: ${JSON.stringify({ type: 'CONNECTED', clientId })}\n\n`);

    // Store client
    this.clients.set(clientId, {
      res,
      branchId: req.query.branchId || null,
      connectedAt: new Date()
    });

    console.log(`SSE Client ${clientId} connected. Total clients: ${this.clients.size}`);

    // Send heartbeat every 30 seconds
    const heartbeatInterval = setInterval(() => {
      if (!this.clients.has(clientId)) {
        clearInterval(heartbeatInterval);
        return;
      }
      try {
        res.write(`:heartbeat\n\n`);
      } catch (error) {
        this.removeClient(clientId);
        clearInterval(heartbeatInterval);
      }
    }, 30000);

    // Handle client disconnect
    req.on('close', () => {
      this.removeClient(clientId);
      clearInterval(heartbeatInterval);
      console.log(`SSE Client ${clientId} disconnected. Total clients: ${this.clients.size}`);
    });

    return clientId;
  }

  /**
   * Remove a client
   */
  removeClient(clientId) {
    this.clients.delete(clientId);
  }

  /**
   * Send event to a specific client
   */
  sendToClient(clientId, event, data) {
    const client = this.clients.get(clientId);
    if (!client) return false;

    try {
      client.res.write(`event: ${event}\n`);
      client.res.write(`data: ${JSON.stringify(data)}\n\n`);
      return true;
    } catch (error) {
      this.removeClient(clientId);
      return false;
    }
  }

  /**
   * Broadcast to all clients
   */
  broadcast(event, data) {
    let sentCount = 0;
    this.clients.forEach((client, clientId) => {
      try {
        client.res.write(`event: ${event}\n`);
        client.res.write(`data: ${JSON.stringify(data)}\n\n`);
        sentCount++;
      } catch (error) {
        this.removeClient(clientId);
      }
    });
    return sentCount;
  }

  /**
   * Broadcast to clients subscribed to a specific branch
   */
  broadcastToBranch(branchId, event, data) {
    let sentCount = 0;
    this.clients.forEach((client, clientId) => {
      // Send to clients watching this branch or all branches (branchId = null)
      if (!client.branchId || client.branchId === branchId) {
        try {
          client.res.write(`event: ${event}\n`);
          client.res.write(`data: ${JSON.stringify(data)}\n\n`);
          sentCount++;
        } catch (error) {
          this.removeClient(clientId);
        }
      }
    });
    return sentCount;
  }

  /**
   * Broadcast availability update
   */
  broadcastAvailabilityUpdate(data) {
    const event = 'availability';
    const payload = {
      ...data,
      timestamp: new Date().toISOString()
    };

    if (data.branchId) {
      return this.broadcastToBranch(data.branchId, event, payload);
    }
    return this.broadcast(event, payload);
  }

  /**
   * Broadcast booking status change
   */
  broadcastBookingUpdate(data) {
    const event = 'booking';
    const payload = {
      ...data,
      timestamp: new Date().toISOString()
    };
    return this.broadcast(event, payload);
  }

  /**
   * Get connected clients count
   */
  getClientCount() {
    return this.clients.size;
  }

  /**
   * Get all connected client info (for debugging)
   */
  getClientInfo() {
    const info = [];
    this.clients.forEach((client, clientId) => {
      info.push({
        clientId,
        branchId: client.branchId,
        connectedAt: client.connectedAt
      });
    });
    return info;
  }
}

// Singleton instance
const sseManager = new SSEManager();

module.exports = { sseManager, SSEManager };
