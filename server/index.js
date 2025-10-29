const express = require('express');
const path = require('path');
const app = express();

// Serve static files from the React app build directory
app.use(express.static(path.join(__dirname, '../client/build')));

// Serve admin panel from /admin path
app.use('/admin', express.static(path.join(__dirname, '../admin/build')));
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv/config');

const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:3002',
    'http://localhost:3006',
    'https://rich-agrisupply-client.vercel.app',
    'https://rich-agrisupply-admin.vercel.app',
];

app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        
        // Check if origin is in allowed list
        if (allowedOrigins.includes(origin)) {
            return callback(null, true);
        }
        
        // For development, allow all origins
        if (process.env.NODE_ENV !== 'production') {
            return callback(null, true);
        }
        
        return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: ['Content-Type', 'Authorization'],
    preflightContinue: false,
    optionsSuccessStatus: 204
}));

//middleware
app.use(bodyParser.json());
app.use(express.json());


//Routes
const userRoutes = require('./routes/user.js');
const categoryRoutes = require('./routes/categories');
const productRoutes = require('./routes/products');
const imageUploadRoutes = require('./helper/imageUpload.js');
const productWeightRoutes = require('./routes/productWeight.js');
const productRAMSRoutes = require('./routes/productRAMS.js');
const productSIZESRoutes = require('./routes/productSize.js');
const productReviews = require('./routes/productReviews.js');
const cartSchema = require('./routes/cart.js');
const myListSchema = require('./routes/myList.js');
const ordersSchema = require('./routes/orders.js');
const homeBannerSchema = require('./routes/homeBanner.js');
const searchRoutes = require('./routes/search.js');
const bannersSchema = require('./routes/banners.js');
const homeSideBannerSchema = require('./routes/homeSideBanner.js');
const homeBottomBannerSchema = require('./routes/homeBottomBanner.js');
const chatRoutes = require('./routes/chat.js');
const reportsRoutes = require('./routes/reports.js');

app.get('/', (req, res) => {
    const pkg = require('./package.json');
    const dbState = mongoose.connection.readyState; // 0=disconnected, 1=connected, 2=connecting, 3=disconnecting
    const isDbConnected = dbState === 1;

    res.status(200).json({
        status: 'ok',
        service: pkg.name || 'backend',
        version: pkg.version,
        message: 'Backend is up and responding.',
        uptimeSeconds: Math.floor(process.uptime()),
        timestamp: new Date().toISOString(),
        port: process.env.PORT,
        environment: process.env.NODE_ENV || 'development',
        database: {
            connected: isDbConnected,
            state: dbState
        }
    });
});

app.use("/api/user", userRoutes);
app.use("/uploads", express.static("uploads"));
app.use(`/api/category`, categoryRoutes);
app.use(`/api/products`, productRoutes);
app.use(`/api/imageUpload`, imageUploadRoutes);
app.use(`/api/productWeight`, productWeightRoutes);
app.use(`/api/productRAMS`, productRAMSRoutes);
app.use(`/api/productSIZE`, productSIZESRoutes);
app.use(`/api/productReviews`, productReviews);
app.use(`/api/cart`, cartSchema);
app.use(`/api/my-list`, myListSchema);
app.use(`/api/orders`, ordersSchema);
app.use(`/api/homeBanner`, homeBannerSchema);
app.use(`/api/search`, searchRoutes);
app.use(`/api/banners`, bannersSchema);
app.use(`/api/homeSideBanners`, homeSideBannerSchema);
app.use(`/api/homeBottomBanners`, homeBottomBannerSchema);
app.use(`/api/chat`, chatRoutes);
app.use(`/api/reports`, reportsRoutes);


//Database
mongoose.connect(process.env.CONNECTION_STRING)
    .then(() => {
        console.log('Database Connection is ready...');
        //Server
        app.listen(process.env.PORT, () => {
            console.log(`server is running http://localhost:${process.env.PORT}`);
        })
    })
    .catch((err) => {
        console.log('MongoDB Connection Error:');
        console.log(err);

        // Start the server even if DB connection fails
        console.log('Starting server without database connection...');
        app.listen(process.env.PORT, () => {
            console.log(`Server is running on http://localhost:${process.env.PORT} (without database)`);
        });
    })

// Handle admin panel routes
app.get('/admin/*', (req, res) => {
    res.sendFile(path.join(__dirname, '../admin/build/index.html'));
});

// Handle main app routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/build/index.html'));
});
