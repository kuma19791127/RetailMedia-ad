const express = require('express');
const cors = require('cors');
const path = require('path');
const inventoryDB = require('./inventory_db');
const spApiClient = require('./sp_api_client');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// Suppress favicon 404
app.get('/favicon.ico', (req, res) => res.status(204).end());

// Serve Mobile App (PWA) for testing
app.use('/app', express.static(path.join(__dirname, '../')));

// Serve Dashboard
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'dashboard.html'));
});

// API: Get Inventory Status (for Dashboard)
app.get('/api/inventory', (req, res) => {
    res.json(inventoryDB.getAll());
});

// Batch: Run Morning Batch (Fetch Amazon Orders & Reserve Stock)
app.post('/api/batch/morning', async (req, res) => {
    try {
        console.log("Starting Morning Batch...");
        // 1. Fetch Orders from Amazon
        const orders = await spApiClient.fetchOrders();

        // 2. Process Reserves
        const results = [];
        orders.forEach(order => {
            order.items.forEach(item => {
                const reserveResult = inventoryDB.reserve(item.sku, item.quantity);
                if (reserveResult) {
                    results.push({
                        orderId: order.amazonOrderId,
                        sku: item.sku,
                        qty: item.quantity,
                        success: true,
                        risk: reserveResult.isRisk
                    });
                }
            });
        });

        console.log("Morning Batch Completed.");
        res.json({
            message: "Morning Batch Completed",
            processedOrders: orders.length,
            details: results
        });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: e.message });
    }
});

// Reset DB (for Demo)
app.post('/api/reset', (req, res) => {
    inventoryDB.reset();
    res.json({ message: "Inventory Reset" });
});

// --- Social Commerce API (Phase 5) ---
const socialEngine = require('./social_engine');
const mockWMS = require('./mock_wms');

// Creator Dashboard
app.get('/creator', (req, res) => {
    res.sendFile(path.join(__dirname, 'creator_dashboard.html'));
});

// Get Creator Stats
app.get('/api/creator/:id/stats', (req, res) => {
    res.json(socialEngine.getCreatorStats(req.params.id));
});

// Simulate Buy Logic (Recipe Bundler -> Conversion)
app.post('/api/recipe/:id/buy', (req, res) => {
    const result = socialEngine.trackConversion(req.params.id);
    if (result) {
        res.json({ success: true, newStats: result });
    } else {
        res.status(404).json({ error: "Recipe not found" });
    }
});

// WMS: Check Delivery Slot
app.get('/api/wms/slots', (req, res) => {
    res.json(mockWMS.getSlots());
});

// --- Retail Media API (Phase 6) ---
const adEngine = require('./ad_engine');
const signageServer = require('./signage_server');

// Advertiser Dashboard
app.get('/advertiser', (req, res) => {
    res.sendFile(path.join(__dirname, 'ad_dashboard.html'));
});

// Business LP (New)
app.get('/business-lp', (req, res) => {
    res.sendFile(path.join(__dirname, 'business_lp.html'));
});

// Advertiser LP (New)
app.get('/advertiser-lp', (req, res) => {
    res.sendFile(path.join(__dirname, 'advertiser_lp.html'));
});

// Agency LP (Portal Entrance)
app.get('/agency-portal', (req, res) => {
    res.sendFile(path.join(__dirname, 'agency_lp.html'));
});

// Agency Dashboard (Logged In)
app.get('/agency-dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'agency_portal.html'));
});

// Analytics Data Endpoint (Attribution + Sigmoid)
app.get('/api/ad/analytics', (req, res) => {
    // Demo: Simulate some ad plays
    const mockPlayLogs = [
        { id: "ad_beer_001", sku: "4977634803472", timestamp: new Date().toISOString() },
        { id: "ad_beer_001", sku: "4977634803472", timestamp: new Date().toISOString() }
    ];

    const attribution = adEngine.calculateAttribution(mockPlayLogs);
    const analysis = adEngine.analyzeThreshold();

    res.json({
        attribution,
        analysis
    });
});

// Signage CMS: Get Playlist
app.get('/api/signage/playlist', (req, res) => {
    const location = req.query.location || 'register_side';
    res.json(signageServer.getPlaylist(location));
});

app.listen(PORT, () => {
    console.log(`Anywhere Connect Middleware running at http://localhost:${PORT}`);
    console.log(`- Operator Dashboard:   http://localhost:${PORT}/`);
    console.log(`- Creator Dashboard:    http://localhost:${PORT}/creator`);
    console.log(`- Advertiser Dashboard: http://localhost:${PORT}/advertiser`);
});
