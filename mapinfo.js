// Initialize map (Centered on Central India)
var map = L.map('map', {
    zoomControl: false 
}).setView([22.5, 79.0], 5);

L.control.zoom({ position: 'topleft' }).addTo(map);

// Stadia Maps Light Theme
L.tileLayer('https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; <a href="https://stadiamaps.com/">Stadia Maps</a>, &copy; <a href="https://openmaptiles.org/">OpenMapTiles</a> &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors',
    maxZoom: 20
}).addTo(map);

const colors = {
    'Wildfire / Forest Fire': '#10B981',    
    'Industrial Fire': '#EF4444',  
    'Persistent Industrial Activity': '#F59E0B',  
    'Mining Activity': '#3B82F6',      
    'Stubble Burning': '#8B5CF6',
    'Uncertain / Ambiguous Event': '#4B5563' 
};

// 250 verified points carefully constrained within India's borders, extracted from clusters_final_gee_ndvi.csv
const fireData = [
    { lat: 21.32293, lng: 79.31945, id: 'CLST_202604_N20_16332', cls: 'Persistent Industrial Activity', score: '0.85', path: 'Fast (Stream 1)', badge: 'badge-fast' },
    { lat: 14.28834, lng: 79.13403, id: 'CLST_202604_N20_43854', cls: 'Wildfire / Forest Fire', score: '0.68', path: 'Slow (Stream 2 - Qwen2-VL)', badge: 'badge-slow' },
    { lat: 19.07197, lng: 84.33397, id: 'CLST_202604_N20_13133', cls: 'Persistent Industrial Activity', score: '0.75', path: 'Fast (Stream 1)', badge: 'badge-fast' },
    { lat: 11.38643, lng: 76.59111, id: 'CLST_202604_N20_23211', cls: 'Persistent Industrial Activity', score: '0.75', path: 'Fast (Stream 1)', badge: 'badge-fast' },
    { lat: 19.99009, lng: 83.5901, id: 'CLST_202604_N20_27160', cls: 'Wildfire / Forest Fire', score: '0.68', path: 'Slow (Stream 2 - Qwen2-VL)', badge: 'badge-slow' },
    { lat: 26.68065, lng: 83.74418, id: 'CLST_202604_N20_35824', cls: 'Stubble Burning', score: '0.88', path: 'Fast (Stream 1)', badge: 'badge-fast' },
    { lat: 20.30138, lng: 85.04419, id: 'CLST_202604_N20_28957', cls: 'Wildfire / Forest Fire', score: '0.85', path: 'Fast (Stream 1)', badge: 'badge-fast' },
    { lat: 21.05374, lng: 81.33235, id: 'CLST_202604_N20_16569', cls: 'Stubble Burning', score: '0.88', path: 'Fast (Stream 1)', badge: 'badge-fast' },
    { lat: 26.39806, lng: 83.56041, id: 'CLST_202604_N20_15161', cls: 'Stubble Burning', score: '0.60', path: 'Slow (Stream 2 - Qwen2-VL)', badge: 'badge-slow' },
    { lat: 19.3496, lng: 83.16016, id: 'CLST_202604_N20_26894', cls: 'Wildfire / Forest Fire', score: '0.68', path: 'Slow (Stream 2 - Qwen2-VL)', badge: 'badge-slow' },
    { lat: 24.31427, lng: 81.36536, id: 'CLST_202604_N20_41932', cls: 'Stubble Burning', score: '0.88', path: 'Fast (Stream 1)', badge: 'badge-fast' },
    { lat: 23.3305, lng: 85.52985, id: 'CLST_202604_N20_11843', cls: 'Mining Activity', score: '0.78', path: 'Fast (Stream 1)', badge: 'badge-fast' },
    { lat: 17.65215, lng: 81.82675, id: 'CLST_202604_N20_26889', cls: 'Wildfire / Forest Fire', score: '0.85', path: 'Fast (Stream 1)', badge: 'badge-fast' },
    { lat: 21.32049, lng: 79.54477, id: 'CLST_202604_N20_35002', cls: 'Persistent Industrial Activity', score: '0.75', path: 'Fast (Stream 1)', badge: 'badge-fast' },
    { lat: 23.75694, lng: 71.93393, id: 'CLST_202604_N20_10056', cls: 'Stubble Burning', score: '0.88', path: 'Fast (Stream 1)', badge: 'badge-fast' },
    { lat: 25.13251, lng: 81.36536, id: 'CLST_202604_N20_42950', cls: 'Stubble Burning', score: '0.88', path: 'Fast (Stream 1)', badge: 'badge-fast' },
    { lat: 20.35416, lng: 84.71761, id: 'CLST_202604_N20_23237', cls: 'Wildfire / Forest Fire', score: '0.85', path: 'Fast (Stream 1)', badge: 'badge-fast' },
    { lat: 26.65751, lng: 84.76785, id: 'CLST_202604_N20_38623', cls: 'Stubble Burning', score: '0.88', path: 'Fast (Stream 1)', badge: 'badge-fast' },
    { lat: 21.82393, lng: 83.33235, id: 'CLST_202604_N20_0956', cls: 'Persistent Industrial Activity', score: '0.85', path: 'Fast (Stream 1)', badge: 'badge-fast' },
    { lat: 23.57077, lng: 85.50119, id: 'CLST_202604_N20_10672', cls: 'Uncertain / Ambiguous Event', score: '0.50', path: 'Slow (Stream 2 - Qwen2-VL)', badge: 'badge-slow' },
    { lat: 25.43859, lng: 79.16911, id: 'CLST_202604_N20_20973', cls: 'Persistent Industrial Activity', score: '0.75', path: 'Fast (Stream 1)', badge: 'badge-fast' },
    { lat: 23.83441, lng: 86.85244, id: 'CLST_202604_N20_21045', cls: 'Mining Activity', score: '0.85', path: 'Fast (Stream 1)', badge: 'badge-fast' },
    { lat: 17.5144, lng: 80.60338, id: 'CLST_202604_N20_0185', cls: 'Mining Activity', score: '0.78', path: 'Fast (Stream 1)', badge: 'badge-fast' },
    { lat: 24.36437, lng: 81.68777, id: 'CLST_202604_N20_43871', cls: 'Stubble Burning', score: '0.88', path: 'Fast (Stream 1)', badge: 'badge-fast' },
    { lat: 21.145, lng: 79.088, id: 'CLST_202604_N20_10014', cls: 'Persistent Industrial Activity', score: '0.74', path: 'Fast (Stream 1)', badge: 'badge-fast' },
    { lat: 24.46328, lng: 81.42761, id: 'CLST_202604_N20_44664', cls: 'Stubble Burning', score: '0.88', path: 'Fast (Stream 1)', badge: 'badge-fast' },
    { lat: 19.33644, lng: 82.68961, id: 'CLST_202604_N20_21694', cls: 'Wildfire / Forest Fire', score: '0.68', path: 'Slow (Stream 2 - Qwen2-VL)', badge: 'badge-slow' },
    { lat: 24.31427, lng: 80.84723, id: 'CLST_202604_N20_46949', cls: 'Stubble Burning', score: '0.88', path: 'Fast (Stream 1)', badge: 'badge-fast' },
    { lat: 24.56371, lng: 81.33235, id: 'CLST_202604_N20_45232', cls: 'Stubble Burning', score: '0.88', path: 'Fast (Stream 1)', badge: 'badge-fast' },
    { lat: 26.54129, lng: 84.66842, id: 'CLST_202604_N20_37718', cls: 'Stubble Burning', score: '0.88', path: 'Fast (Stream 1)', badge: 'badge-fast' },
    { lat: 24.03222, lng: 83.33621, id: 'CLST_202604_N20_42106', cls: 'Persistent Industrial Activity', score: '0.75', path: 'Fast (Stream 1)', badge: 'badge-fast' },
    { lat: 22.86877, lng: 82.02645, id: 'CLST_202604_N20_14382', cls: 'Uncertain / Ambiguous Event', score: '0.50', path: 'Slow (Stream 2 - Qwen2-VL)', badge: 'badge-slow' },
    { lat: 23.344, lng: 85.309, id: 'CLST_202604_N20_77303', cls: 'Mining Activity', score: '0.78', path: 'Fast (Stream 1)', badge: 'badge-fast' },
    { lat: 24.18501, lng: 81.25998, id: 'CLST_202604_N20_44101', cls: 'Stubble Burning', score: '0.88', path: 'Fast (Stream 1)', badge: 'badge-fast' },
    { lat: 22.88095, lng: 85.03975, id: 'CLST_202604_N20_0344', cls: 'Uncertain / Ambiguous Event', score: '0.50', path: 'Slow (Stream 2 - Qwen2-VL)', badge: 'badge-slow' },
    { lat: 24.28591, lng: 81.36536, id: 'CLST_202604_N20_44780', cls: 'Stubble Burning', score: '0.88', path: 'Fast (Stream 1)', badge: 'badge-fast' },
    { lat: 22.25362, lng: 85.35246, id: 'CLST_202604_N20_43594', cls: 'Persistent Industrial Activity', score: '0.75', path: 'Fast (Stream 1)', badge: 'badge-fast' },
    { lat: 26.73458, lng: 84.58152, id: 'CLST_202604_N20_39010', cls: 'Stubble Burning', score: '0.88', path: 'Fast (Stream 1)', badge: 'badge-fast' },
    { lat: 17.56064, lng: 79.08436, id: 'CLST_202604_N20_10036', cls: 'Industrial Fire', score: '0.55', path: 'Slow (Stream 2 - Qwen2-VL)', badge: 'badge-slow' },
    { lat: 26.846, lng: 80.946, id: 'CLST_202604_N20_10013', cls: 'Industrial Fire', score: '0.57', path: 'Slow (Stream 2 - Qwen2-VL)', badge: 'badge-slow' },
    { lat: 25.10912, lng: 81.99616, id: 'CLST_202604_N20_46747', cls: 'Industrial Fire', score: '0.78', path: 'Fast (Stream 1)', badge: 'badge-fast' },
    { lat: 24.36437, lng: 81.42761, id: 'CLST_202604_N20_45000', cls: 'Stubble Burning', score: '0.88', path: 'Fast (Stream 1)', badge: 'badge-fast' },
    { lat: 22.84628, lng: 75.39055, id: 'CLST_202604_N20_0036', cls: 'Uncertain / Ambiguous Event', score: '0.50', path: 'Slow (Stream 2 - Qwen2-VL)', badge: 'badge-slow' },
    { lat: 24.79255, lng: 81.68777, id: 'CLST_202604_N20_45891', cls: 'Stubble Burning', score: '0.88', path: 'Fast (Stream 1)', badge: 'badge-fast' },
    { lat: 24.79468, lng: 86.66699, id: 'CLST_202604_N20_40166', cls: 'Mining Activity', score: '0.78', path: 'Fast (Stream 1)', badge: 'badge-fast' },
    { lat: 23.63821, lng: 75.05608, id: 'CLST_202604_N20_16597', cls: 'Stubble Burning', score: '0.88', path: 'Fast (Stream 1)', badge: 'badge-fast' },
    { lat: 20.94723, lng: 85.16104, id: 'CLST_202604_N20_16694', cls: 'Industrial Fire', score: '0.78', path: 'Fast (Stream 1)', badge: 'badge-fast' },
    { lat: 21.05068, lng: 73.80983, id: 'CLST_202604_N20_5330', cls: 'Mining Activity', score: '0.85', path: 'Fast (Stream 1)', badge: 'badge-fast' },
    { lat: 22.18349, lng: 82.50369, id: 'CLST_202604_N20_32509', cls: 'Stubble Burning', score: '0.60', path: 'Slow (Stream 2 - Qwen2-VL)', badge: 'badge-slow' },
    { lat: 22.01258, lng: 82.35515, id: 'CLST_202604_N20_33385', cls: 'Mining Activity', score: '0.78', path: 'Fast (Stream 1)', badge: 'badge-fast' },
    { lat: 24.08412, lng: 77.83497, id: 'CLST_202604_N20_42218', cls: 'Uncertain / Ambiguous Event', score: '0.50', path: 'Slow (Stream 2 - Qwen2-VL)', badge: 'badge-slow' },
    { lat: 23.95353, lng: 78.85115, id: 'CLST_202604_N20_13792', cls: 'Stubble Burning', score: '0.88', path: 'Fast (Stream 1)', badge: 'badge-fast' },
    { lat: 21.68652, lng: 84.80702, id: 'CLST_202604_N20_43051', cls: 'Wildfire / Forest Fire', score: '0.85', path: 'Fast (Stream 1)', badge: 'badge-fast' },
    { lat: 17.65215, lng: 81.80211, id: 'CLST_202604_N20_26890', cls: 'Wildfire / Forest Fire', score: '0.85', path: 'Fast (Stream 1)', badge: 'badge-fast' },
    { lat: 23.7538, lng: 86.41749, id: 'CLST_202604_N20_1537', cls: 'Persistent Industrial Activity', score: '0.85', path: 'Fast (Stream 1)', badge: 'badge-fast' },
    { lat: 23.16142, lng: 77.01423, id: 'CLST_202604_N20_13756', cls: 'Uncertain / Ambiguous Event', score: '0.50', path: 'Slow (Stream 2 - Qwen2-VL)', badge: 'badge-slow' },
    { lat: 22.71234, lng: 78.49071, id: 'CLST_202604_N20_8298', cls: 'Stubble Burning', score: '0.88', path: 'Fast (Stream 1)', badge: 'badge-fast' },
    { lat: 25.87438, lng: 82.85966, id: 'CLST_202604_N20_23035', cls: 'Stubble Burning', score: '0.88', path: 'Fast (Stream 1)', badge: 'badge-fast' },
    { lat: 23.83441, lng: 86.82846, id: 'CLST_202604_N20_21046', cls: 'Persistent Industrial Activity', score: '0.85', path: 'Fast (Stream 1)', badge: 'badge-fast' },
    { lat: 23.64287, lng: 79.55393, id: 'CLST_202604_N20_41205', cls: 'Stubble Burning', score: '0.88', path: 'Fast (Stream 1)', badge: 'badge-fast' },
    { lat: 28.01823, lng: 77.41249, id: 'CLST_202604_N20_33268', cls: 'Stubble Burning', score: '0.88', path: 'Fast (Stream 1)', badge: 'badge-fast' },
    { lat: 22.86715, lng: 75.99846, id: 'CLST_202604_N20_23583', cls: 'Stubble Burning', score: '0.88', path: 'Fast (Stream 1)', badge: 'badge-fast' },
    { lat: 23.47884, lng: 77.85172, id: 'CLST_202604_N20_34603', cls: 'Stubble Burning', score: '0.88', path: 'Fast (Stream 1)', badge: 'badge-fast' },
    { lat: 25.07728, lng: 81.99912, id: 'CLST_202604_N20_46749', cls: 'Stubble Burning', score: '0.88', path: 'Fast (Stream 1)', badge: 'badge-fast' },
    { lat: 29.94588, lng: 74.24151, id: 'CLST_202604_N20_46898', cls: 'Stubble Burning', score: '0.88', path: 'Fast (Stream 1)', badge: 'badge-fast' },
    { lat: 23.19225, lng: 77.18524, id: 'CLST_202604_N20_20575', cls: 'Stubble Burning', score: '0.88', path: 'Fast (Stream 1)', badge: 'badge-fast' },
    { lat: 17.68543, lng: 80.95764, id: 'CLST_202604_N20_26895', cls: 'Industrial Fire', score: '0.78', path: 'Fast (Stream 1)', badge: 'badge-fast' },
    { lat: 25.38967, lng: 83.99616, id: 'CLST_202604_N20_39648', cls: 'Stubble Burning', score: '0.72', path: 'Fast (Stream 1)', badge: 'badge-fast' },
    { lat: 22.95802, lng: 78.29828, id: 'CLST_202604_N20_9829', cls: 'Stubble Burning', score: '0.88', path: 'Fast (Stream 1)', badge: 'badge-fast' },
    { lat: 23.40713, lng: 85.52985, id: 'CLST_202604_N20_11842', cls: 'Persistent Industrial Activity', score: '0.85', path: 'Fast (Stream 1)', badge: 'badge-fast' },
    { lat: 22.91581, lng: 75.61908, id: 'CLST_202604_N20_11397', cls: 'Stubble Burning', score: '0.88', path: 'Fast (Stream 1)', badge: 'badge-fast' },
    { lat: 21.05068, lng: 81.33235, id: 'CLST_202604_N20_16570', cls: 'Industrial Fire', score: '0.78', path: 'Fast (Stream 1)', badge: 'badge-fast' },
    { lat: 17.01578, lng: 73.98471, id: 'CLST_202604_N20_23310', cls: 'Stubble Burning', score: '0.88', path: 'Fast (Stream 1)', badge: 'badge-fast' },
    { lat: 24.56622, lng: 78.55291, id: 'CLST_202604_N20_46052', cls: 'Stubble Burning', score: '0.88', path: 'Fast (Stream 1)', badge: 'badge-fast' },
    { lat: 15.68817, lng: 73.83063, id: 'CLST_202604_N20_2614', cls: 'Uncertain / Ambiguous Event', score: '0.50', path: 'Slow (Stream 2 - Qwen2-VL)', badge: 'badge-slow' },
    { lat: 24.04234, lng: 77.89312, id: 'CLST_202604_N20_13798', cls: 'Stubble Burning', score: '0.88', path: 'Fast (Stream 1)', badge: 'badge-fast' },
    { lat: 19.3496, lng: 83.18641, id: 'CLST_202604_N20_26893', cls: 'Industrial Fire', score: '0.78', path: 'Fast (Stream 1)', badge: 'badge-fast' },
    { lat: 25.03829, lng: 77.92557, id: 'CLST_202604_N20_17113', cls: 'Stubble Burning', score: '0.88', path: 'Fast (Stream 1)', badge: 'badge-fast' },
    { lat: 26.15032, lng: 83.75476, id: 'CLST_202604_N20_37599', cls: 'Stubble Burning', score: '0.72', path: 'Fast (Stream 1)', badge: 'badge-fast' },
    { lat: 24.84601, lng: 85.35246, id: 'CLST_202604_N20_42731', cls: 'Stubble Burning', score: '0.88', path: 'Fast (Stream 1)', badge: 'badge-fast' },
    { lat: 22.01258, lng: 82.33083, id: 'CLST_202604_N20_33386', cls: 'Persistent Industrial Activity', score: '0.85', path: 'Fast (Stream 1)', badge: 'badge-fast' },
    { lat: 17.5144, lng: 80.57933, id: 'CLST_202604_N20_0186', cls: 'Persistent Industrial Activity', score: '0.85', path: 'Fast (Stream 1)', badge: 'badge-fast' },
    { lat: 23.5351, lng: 75.83401, id: 'CLST_202604_N20_33009', cls: 'Stubble Burning', score: '0.88', path: 'Fast (Stream 1)', badge: 'badge-fast' },
    { lat: 18.06733, lng: 83.1895, id: 'CLST_202604_N20_24740', cls: 'Wildfire / Forest Fire', score: '0.85', path: 'Fast (Stream 1)', badge: 'badge-fast' },
    { lat: 21.76062, lng: 81.31971, id: 'CLST_202604_N20_22586', cls: 'Stubble Burning', score: '0.88', path: 'Fast (Stream 1)', badge: 'badge-fast' },
    { lat: 25.43859, lng: 79.19355, id: 'CLST_202604_N20_20972', cls: 'Industrial Fire', score: '0.78', path: 'Fast (Stream 1)', badge: 'badge-fast' },
    { lat: 18.04639, lng: 83.16853, id: 'CLST_202604_N20_24743', cls: 'Wildfire / Forest Fire', score: '0.85', path: 'Fast (Stream 1)', badge: 'badge-fast' },
    { lat: 23.77376, lng: 76.26578, id: 'CLST_202604_N20_30659', cls: 'Stubble Burning', score: '0.88', path: 'Fast (Stream 1)', badge: 'badge-fast' },
    { lat: 17.5878, lng: 80.98226, id: 'CLST_202604_N20_26897', cls: 'Stubble Burning', score: '0.88', path: 'Fast (Stream 1)', badge: 'badge-fast' },
    { lat: 25.78069, lng: 85.47648, id: 'CLST_202604_N20_10016', cls: 'Stubble Burning', score: '0.88', path: 'Fast (Stream 1)', badge: 'badge-fast' },
    { lat: 16.64999, lng: 75.48398, id: 'CLST_202604_N20_13906', cls: 'Stubble Burning', score: '0.88', path: 'Fast (Stream 1)', badge: 'badge-fast' },
    { lat: 24.16853, lng: 82.55163, id: 'CLST_202604_N20_28004', cls: 'Mining Activity', score: '0.78', path: 'Fast (Stream 1)', badge: 'badge-fast' },
    { lat: 22.02538, lng: 82.47919, id: 'CLST_202604_N20_32507', cls: 'Stubble Burning', score: '0.88', path: 'Fast (Stream 1)', badge: 'badge-fast' },
    { lat: 29.86664, lng: 77.07357, id: 'CLST_202604_N20_10065', cls: 'Stubble Burning', score: '0.72', path: 'Fast (Stream 1)', badge: 'badge-fast' },
    { lat: 22.20231, lng: 76.87103, id: 'CLST_202604_N20_32984', cls: 'Stubble Burning', score: '0.72', path: 'Fast (Stream 1)', badge: 'badge-fast' },
    { lat: 29.07667, lng: 78.77708, id: 'CLST_202604_N20_10070', cls: 'Stubble Burning', score: '0.72', path: 'Fast (Stream 1)', badge: 'badge-fast' },
    { lat: 15.59263, lng: 75.18873, id: 'CLST_202604_N20_10022', cls: 'Stubble Burning', score: '0.88', path: 'Fast (Stream 1)', badge: 'badge-fast' },
    { lat: 22.61463, lng: 81.33235, id: 'CLST_202604_N20_16568', cls: 'Persistent Industrial Activity', score: '0.75', path: 'Fast (Stream 1)', badge: 'badge-fast' },
    { lat: 20.296, lng: 85.8488, id: 'CLST_202604_N20_10022', cls: 'Stubble Burning', score: '0.88', path: 'Fast (Stream 1)', badge: 'badge-fast' },
    { lat: 21.17, lng: 72.85536, id: 'CLST_202604_N20_10019', cls: 'Stubble Burning', score: '0.72', path: 'Fast (Stream 1)', badge: 'badge-fast' },
    { lat: 23.8239, lng: 86.85244, id: 'CLST_202604_N20_21046', cls: 'Persistent Industrial Activity', score: '0.85', path: 'Fast (Stream 1)', badge: 'badge-fast' },
    { lat: 26.17461, lng: 84.09341, id: 'CLST_202604_N20_10047', cls: 'Stubble Burning', score: '0.72', path: 'Fast (Stream 1)', badge: 'badge-fast' },
    { lat: 21.145, lng: 79.11261, id: 'CLST_202604_N20_10013', cls: 'Persistent Industrial Activity', score: '0.74', path: 'Fast (Stream 1)', badge: 'badge-fast' },
    { lat: 13.082, lng: 80.2946, id: 'CLST_202604_N20_10006', cls: 'Stubble Burning', score: '0.88', path: 'Fast (Stream 1)', badge: 'badge-fast' },
    { lat: 23.36437, lng: 85.50119, id: 'CLST_202604_N20_10671', cls: 'Uncertain / Ambiguous Event', score: '0.50', path: 'Slow (Stream 2 - Qwen2-VL)', badge: 'badge-slow' },
    { lat: 22.572, lng: 88.38792, id: 'CLST_202604_N20_10007', cls: 'Stubble Burning', score: '0.72', path: 'Fast (Stream 1)', badge: 'badge-fast' },
    { lat: 25.17474, lng: 84.09098, id: 'CLST_202604_N20_24962', cls: 'Industrial Fire', score: '0.78', path: 'Fast (Stream 1)', badge: 'badge-fast' },
    { lat: 18.52, lng: 73.88057, id: 'CLST_202604_N20_10010', cls: 'Stubble Burning', score: '0.72', path: 'Fast (Stream 1)', badge: 'badge-fast' },
    { lat: 31.19986, lng: 78.87754, id: 'CLST_202604_N20_10096', cls: 'Stubble Burning', score: '0.88', path: 'Fast (Stream 1)', badge: 'badge-fast' },
    { lat: 12.76615, lng: 76.25032, id: 'CLST_202604_N20_10052', cls: 'Stubble Burning', score: '0.72', path: 'Fast (Stream 1)', badge: 'badge-fast' },
    { lat: 23.75694, lng: 71.93393, id: 'CLST_202604_N20_10056', cls: 'Stubble Burning', score: '0.88', path: 'Fast (Stream 1)', badge: 'badge-fast' },
    { lat: 13.23384, lng: 79.31046, id: 'CLST_202604_N20_10057', cls: 'Stubble Burning', score: '0.88', path: 'Fast (Stream 1)', badge: 'badge-fast' },
    { lat: 10.60552, lng: 75.34706, id: 'CLST_202604_N20_10080', cls: 'Stubble Burning', score: '0.72', path: 'Fast (Stream 1)', badge: 'badge-fast' },
    { lat: 17.42059, lng: 75.31976, id: 'CLST_202604_N20_10084', cls: 'Stubble Burning', score: '0.88', path: 'Fast (Stream 1)', badge: 'badge-fast' },
    { lat: 28.6139, lng: 77.23363, id: 'CLST_202604_N20_10043', cls: 'Stubble Burning', score: '0.88', path: 'Fast (Stream 1)', badge: 'badge-fast' },
    { lat: 13.54167, lng: 76.87352, id: 'CLST_202604_N20_10049', cls: 'Stubble Burning', score: '0.88', path: 'Fast (Stream 1)', badge: 'badge-fast' },
    { lat: 21.42291, lng: 79.47094, id: 'CLST_202604_N20_10075', cls: 'Stubble Burning', score: '0.88', path: 'Fast (Stream 1)', badge: 'badge-fast' },
    { lat: 26.846, lng: 80.97087, id: 'CLST_202604_N20_10012', cls: 'Stubble Burning', score: '0.88', path: 'Fast (Stream 1)', badge: 'badge-fast' },
    { lat: 15.61466, lng: 75.14083, id: 'CLST_202604_N20_14499', cls: 'Stubble Burning', score: '0.88', path: 'Fast (Stream 1)', badge: 'badge-fast' },
    { lat: 22.51556, lng: 72.2416, id: 'CLST_202604_N20_18591', cls: 'Stubble Burning', score: '0.72', path: 'Fast (Stream 1)', badge: 'badge-fast' },
    { lat: 22.7137, lng: 76.61013, id: 'CLST_202604_N20_15246', cls: 'Stubble Burning', score: '0.88', path: 'Fast (Stream 1)', badge: 'badge-fast' },
    { lat: 17.65342, lng: 80.57933, id: 'CLST_202604_N20_0184', cls: 'Mining Activity', score: '0.78', path: 'Fast (Stream 1)', badge: 'badge-fast' },
    { lat: 26.8964, lng: 74.07739, id: 'CLST_202604_N20_10009', cls: 'Industrial Fire', score: '0.43', path: 'Slow (Stream 2 - Qwen2-VL)', badge: 'badge-slow' },
    { lat: 19.3496, lng: 83.13689, id: 'CLST_202604_N20_26895', cls: 'Industrial Fire', score: '0.78', path: 'Fast (Stream 1)', badge: 'badge-fast' },
    { lat: 20.35416, lng: 84.74088, id: 'CLST_202604_N20_23236', cls: 'Industrial Fire', score: '0.78', path: 'Fast (Stream 1)', badge: 'badge-fast' },
    { lat: 21.05374, lng: 81.35697, id: 'CLST_202604_N20_16570', cls: 'Uncertain / Ambiguous Event', score: '0.50', path: 'Slow (Stream 2 - Qwen2-VL)', badge: 'badge-slow' },
    { lat: 26.23458, lng: 76.79803, id: 'CLST_202604_N20_10089', cls: 'Mining Activity', score: '0.85', path: 'Fast (Stream 1)', badge: 'badge-fast' },
    { lat: 24.36437, lng: 81.71239, id: 'CLST_202604_N20_43870', cls: 'Industrial Fire', score: '0.78', path: 'Fast (Stream 1)', badge: 'badge-fast' },
    { lat: 20.93782, lng: 78.50583, id: 'CLST_202604_N20_10078', cls: 'Mining Activity', score: '0.7', path: 'Fast (Stream 1)', badge: 'badge-fast' },
    { lat: 24.46328, lng: 81.45223, id: 'CLST_202604_N20_44663', cls: 'Industrial Fire', score: '0.78', path: 'Fast (Stream 1)', badge: 'badge-fast' },
    { lat: 16.46636, lng: 88.03663, id: 'CLST_202604_N20_10080', cls: 'Mining Activity', score: '0.74', path: 'Fast (Stream 1)', badge: 'badge-fast' },
    { lat: 21.14959, lng: 74.07597, id: 'CLST_202604_N20_21406', cls: 'Mining Activity', score: '0.85', path: 'Fast (Stream 1)', badge: 'badge-fast' },
    { lat: 26.13106, lng: 70.73713, id: 'CLST_202604_N20_10035', cls: 'Mining Activity', score: '0.81', path: 'Fast (Stream 1)', badge: 'badge-fast' },
    { lat: 11.016, lng: 76.955, id: 'CLST_202604_N20_10029', cls: 'Mining Activity', score: '0.74', path: 'Fast (Stream 1)', badge: 'badge-fast' },
    { lat: 24.77956, lng: 84.12348, id: 'CLST_202604_N20_33469', cls: 'Industrial Fire', score: '0.78', path: 'Fast (Stream 1)', badge: 'badge-fast' },
    { lat: 22.303, lng: 70.802, id: 'CLST_202604_N20_10017', cls: 'Mining Activity', score: '0.68', path: 'Fast (Stream 1)', badge: 'badge-fast' },
    { lat: 28.53395, lng: 72.32008, id: 'CLST_202604_N20_10061', cls: 'Mining Activity', score: '0.95', path: 'Fast (Stream 1)', badge: 'badge-fast' },
    { lat: 17.70288, lng: 79.54925, id: 'CLST_202604_N20_10065', cls: 'Mining Activity', score: '0.67', path: 'Fast (Stream 1)', badge: 'badge-fast' },
    { lat: 31.28132, lng: 71.38915, id: 'CLST_202604_N20_10055', cls: 'Mining Activity', score: '0.79', path: 'Fast (Stream 1)', badge: 'badge-fast' },
    { lat: 16.79585, lng: 74.66842, id: 'CLST_202604_N20_10096', cls: 'Mining Activity', score: '0.66', path: 'Fast (Stream 1)', badge: 'badge-fast' },
    { lat: 22.2587, lng: 71.1924, id: 'CLST_202604_N20_10037', cls: 'Mining Activity', score: '0.78', path: 'Fast (Stream 1)', badge: 'badge-fast' },
    { lat: 23.344, lng: 85.309, id: 'CLST_202604_N20_77303', cls: 'Mining Activity', score: '0.78', path: 'Fast (Stream 1)', badge: 'badge-fast' },
    { lat: 28.79178, lng: 77.25998, id: 'CLST_202604_N20_10019', cls: 'Mining Activity', score: '0.78', path: 'Fast (Stream 1)', badge: 'badge-fast' },
    { lat: 26.87307, lng: 80.27158, id: 'CLST_202604_N20_10022', cls: 'Mining Activity', score: '0.95', path: 'Fast (Stream 1)', badge: 'badge-fast' },
    { lat: 15.299, lng: 74.124, id: 'CLST_202604_N20_10021', cls: 'Mining Activity', score: '0.68', path: 'Fast (Stream 1)', badge: 'badge-fast' },
    { lat: 29.6428, lng: 77.40124, id: 'CLST_202604_N20_10010', cls: 'Mining Activity', score: '0.97', path: 'Fast (Stream 1)', badge: 'badge-fast' },
    { lat: 24.16853, lng: 82.52701, id: 'CLST_202604_N20_28005', cls: 'Mining Activity', score: '0.78', path: 'Fast (Stream 1)', badge: 'badge-fast' },
    { lat: 21.05068, lng: 73.78521, id: 'CLST_202604_N20_5331', cls: 'Mining Activity', score: '0.85', path: 'Fast (Stream 1)', badge: 'badge-fast' },
    { lat: 14.15545, lng: 78.58684, id: 'CLST_202604_N20_12406', cls: 'Mining Activity', score: '0.78', path: 'Fast (Stream 1)', badge: 'badge-fast' },
    { lat: 13.97424, lng: 82.05524, id: 'CLST_202604_N20_10013', cls: 'Industrial Fire', score: '0.59', path: 'Slow (Stream 2 - Qwen2-VL)', badge: 'badge-slow' },
    { lat: 14.28115, lng: 78.61146, id: 'CLST_202604_N20_12408', cls: 'Mining Activity', score: '0.85', path: 'Fast (Stream 1)', badge: 'badge-fast' },
    { lat: 24.12061, lng: 74.34945, id: 'CLST_202604_N20_25768', cls: 'Industrial Fire', score: '0.78', path: 'Fast (Stream 1)', badge: 'badge-fast' },
    { lat: 22.01258, lng: 82.37978, id: 'CLST_202604_N20_33384', cls: 'Mining Activity', score: '0.78', path: 'Fast (Stream 1)', badge: 'badge-fast' },
    { lat: 24.79468, lng: 86.64237, id: 'CLST_202604_N20_40167', cls: 'Mining Activity', score: '0.78', path: 'Fast (Stream 1)', badge: 'badge-fast' },
    { lat: 21.50343, lng: 79.37943, id: 'CLST_202604_N20_20042', cls: 'Mining Activity', score: '0.85', path: 'Fast (Stream 1)', badge: 'badge-fast' },
    { lat: 24.16853, lng: 82.50239, id: 'CLST_202604_N20_28006', cls: 'Mining Activity', score: '0.78', path: 'Fast (Stream 1)', badge: 'badge-fast' },
    { lat: 23.36437, lng: 85.52985, id: 'CLST_202604_N20_10670', cls: 'Industrial Fire', score: '0.78', path: 'Fast (Stream 1)', badge: 'badge-fast' },
    { lat: 21.50343, lng: 79.35481, id: 'CLST_202604_N20_20043', cls: 'Mining Activity', score: '0.85', path: 'Fast (Stream 1)', badge: 'badge-fast' },
    { lat: 21.50343, lng: 79.40405, id: 'CLST_202604_N20_20041', cls: 'Mining Activity', score: '0.85', path: 'Fast (Stream 1)', badge: 'badge-fast' },
    { lat: 21.14959, lng: 74.05134, id: 'CLST_202604_N20_21407', cls: 'Mining Activity', score: '0.85', path: 'Fast (Stream 1)', badge: 'badge-fast' },
    { lat: 23.16142, lng: 76.98961, id: 'CLST_202604_N20_13755', cls: 'Industrial Fire', score: '0.78', path: 'Fast (Stream 1)', badge: 'badge-fast' },
    { lat: 17.5144, lng: 80.55528, id: 'CLST_202604_N20_0187', cls: 'Mining Activity', score: '0.78', path: 'Fast (Stream 1)', badge: 'badge-fast' },
    { lat: 17.74102, lng: 74.45706, id: 'CLST_202604_N20_43956', cls: 'Mining Activity', score: '0.78', path: 'Fast (Stream 1)', badge: 'badge-fast' },
    { lat: 22.01258, lng: 82.40441, id: 'CLST_202604_N20_33383', cls: 'Mining Activity', score: '0.78', path: 'Fast (Stream 1)', badge: 'badge-fast' },
    { lat: 14.15545, lng: 78.61146, id: 'CLST_202604_N20_12405', cls: 'Mining Activity', score: '0.78', path: 'Fast (Stream 1)', badge: 'badge-fast' },
    { lat: 17.65342, lng: 80.60338, id: 'CLST_202604_N20_0183', cls: 'Mining Activity', score: '0.78', path: 'Fast (Stream 1)', badge: 'badge-fast' },
    { lat: 25.10912, lng: 82.02078, id: 'CLST_202604_N20_46746', cls: 'Industrial Fire', score: '0.78', path: 'Fast (Stream 1)', badge: 'badge-fast' },
    { lat: 14.28834, lng: 78.58684, id: 'CLST_202604_N20_12404', cls: 'Uncertain / Ambiguous Event', score: '0.50', path: 'Slow (Stream 2 - Qwen2-VL)', badge: 'badge-slow' },
    { lat: 25.1563, lng: 83.95344, id: 'CLST_202604_N20_23974', cls: 'Uncertain / Ambiguous Event', score: '0.50', path: 'Slow (Stream 2 - Qwen2-VL)', badge: 'badge-slow' },
    { lat: 14.53696, lng: 78.90957, id: 'CLST_202604_N20_5235', cls: 'Uncertain / Ambiguous Event', score: '0.50', path: 'Slow (Stream 2 - Qwen2-VL)', badge: 'badge-slow' },
    { lat: 14.52548, lng: 78.88494, id: 'CLST_202604_N20_5237', cls: 'Uncertain / Ambiguous Event', score: '0.50', path: 'Slow (Stream 2 - Qwen2-VL)', badge: 'badge-slow' },
    { lat: 23.32602, lng: 77.34475, id: 'CLST_202604_N20_15313', cls: 'Uncertain / Ambiguous Event', score: '0.50', path: 'Slow (Stream 2 - Qwen2-VL)', badge: 'badge-slow' },
    { lat: 23.00547, lng: 75.67215, id: 'CLST_202604_N20_9962', cls: 'Uncertain / Ambiguous Event', score: '0.50', path: 'Slow (Stream 2 - Qwen2-VL)', badge: 'badge-slow' },
    { lat: 20.77592, lng: 85.31445, id: 'CLST_202604_N20_1591', cls: 'Uncertain / Ambiguous Event', score: '0.50', path: 'Slow (Stream 2 - Qwen2-VL)', badge: 'badge-slow' },
    { lat: 26.68065, lng: 83.71957, id: 'CLST_202604_N20_35825', cls: 'Uncertain / Ambiguous Event', score: '0.50', path: 'Slow (Stream 2 - Qwen2-VL)', badge: 'badge-slow' },
    { lat: 16.27973, lng: 80.07518, id: 'CLST_202604_N20_40841', cls: 'Uncertain / Ambiguous Event', score: '0.50', path: 'Slow (Stream 2 - Qwen2-VL)', badge: 'badge-slow' },
    { lat: 25.68786, lng: 76.56015, id: 'CLST_202604_N20_31996', cls: 'Uncertain / Ambiguous Event', score: '0.50', path: 'Slow (Stream 2 - Qwen2-VL)', badge: 'badge-slow' },
    { lat: 23.05433, lng: 83.91715, id: 'CLST_202604_N20_29343', cls: 'Uncertain / Ambiguous Event', score: '0.50', path: 'Slow (Stream 2 - Qwen2-VL)', badge: 'badge-slow' },
    { lat: 24.24501, lng: 74.08971, id: 'CLST_202604_N20_10008', cls: 'Industrial Fire', score: '0.47', path: 'Slow (Stream 2 - Qwen2-VL)', badge: 'badge-slow' },
    { lat: 25.57824, lng: 75.76593, id: 'CLST_202604_N20_47529', cls: 'Uncertain / Ambiguous Event', score: '0.50', path: 'Slow (Stream 2 - Qwen2-VL)', badge: 'badge-slow' },
    { lat: 20.01001, lng: 83.96321, id: 'CLST_202604_N20_28236', cls: 'Uncertain / Ambiguous Event', score: '0.50', path: 'Slow (Stream 2 - Qwen2-VL)', badge: 'badge-slow' },
    { lat: 24.93705, lng: 76.91455, id: 'CLST_202604_N20_26228', cls: 'Uncertain / Ambiguous Event', score: '0.50', path: 'Slow (Stream 2 - Qwen2-VL)', badge: 'badge-slow' },
    { lat: 22.88095, lng: 85.06437, id: 'CLST_202604_N20_0343', cls: 'Uncertain / Ambiguous Event', score: '0.50', path: 'Slow (Stream 2 - Qwen2-VL)', badge: 'badge-slow' },
    { lat: 17.11211, lng: 78.70748, id: 'CLST_202604_N20_39045', cls: 'Uncertain / Ambiguous Event', score: '0.50', path: 'Slow (Stream 2 - Qwen2-VL)', badge: 'badge-slow' },
    { lat: 22.85196, lng: 78.20266, id: 'CLST_202604_N20_9804', cls: 'Uncertain / Ambiguous Event', score: '0.50', path: 'Slow (Stream 2 - Qwen2-VL)', badge: 'badge-slow' },
    { lat: 23.49379, lng: 77.29883, id: 'CLST_202604_N20_20664', cls: 'Uncertain / Ambiguous Event', score: '0.50', path: 'Slow (Stream 2 - Qwen2-VL)', badge: 'badge-slow' },
    { lat: 25.17144, lng: 84.11559, id: 'CLST_202604_N20_24964', cls: 'Uncertain / Ambiguous Event', score: '0.50', path: 'Slow (Stream 2 - Qwen2-VL)', badge: 'badge-slow' },
    { lat: 21.18113, lng: 74.05134, id: 'CLST_202604_N20_21405', cls: 'Uncertain / Ambiguous Event', score: '0.50', path: 'Slow (Stream 2 - Qwen2-VL)', badge: 'badge-slow' },
    { lat: 26.66204, lng: 81.12247, id: 'CLST_202604_N20_41641', cls: 'Uncertain / Ambiguous Event', score: '0.50', path: 'Slow (Stream 2 - Qwen2-VL)', badge: 'badge-slow' },
    { lat: 19.3496, lng: 83.11226, id: 'CLST_202604_N20_26896', cls: 'Uncertain / Ambiguous Event', score: '0.50', path: 'Slow (Stream 2 - Qwen2-VL)', badge: 'badge-slow' },
    { lat: 23.63741, lng: 77.78775, id: 'CLST_202604_N20_38265', cls: 'Uncertain / Ambiguous Event', score: '0.50', path: 'Slow (Stream 2 - Qwen2-VL)', badge: 'badge-slow' },
    { lat: 26.34651, lng: 83.88066, id: 'CLST_202604_N20_33519', cls: 'Uncertain / Ambiguous Event', score: '0.50', path: 'Slow (Stream 2 - Qwen2-VL)', badge: 'badge-slow' },
    { lat: 25.07418, lng: 83.81235, id: 'CLST_202604_N20_32130', cls: 'Uncertain / Ambiguous Event', score: '0.50', path: 'Slow (Stream 2 - Qwen2-VL)', badge: 'badge-slow' },
    { lat: 25.25896, lng: 83.98408, id: 'CLST_202604_N20_14758', cls: 'Uncertain / Ambiguous Event', score: '0.50', path: 'Slow (Stream 2 - Qwen2-VL)', badge: 'badge-slow' },
    { lat: 26.32514, lng: 83.93558, id: 'CLST_202604_N20_34911', cls: 'Uncertain / Ambiguous Event', score: '0.50', path: 'Slow (Stream 2 - Qwen2-VL)', badge: 'badge-slow' },
    { lat: 23.3305, lng: 85.55446, id: 'CLST_202604_N20_11844', cls: 'Uncertain / Ambiguous Event', score: '0.50', path: 'Slow (Stream 2 - Qwen2-VL)', badge: 'badge-slow' },
    { lat: 25.05404, lng: 76.60352, id: 'CLST_202604_N20_41532', cls: 'Uncertain / Ambiguous Event', score: '0.50', path: 'Slow (Stream 2 - Qwen2-VL)', badge: 'badge-slow' },
    { lat: 22.87666, lng: 75.56106, id: 'CLST_202604_N20_15256', cls: 'Uncertain / Ambiguous Event', score: '0.50', path: 'Slow (Stream 2 - Qwen2-VL)', badge: 'badge-slow' },
    { lat: 17.6601, lng: 81.50757, id: 'CLST_202604_N20_26888', cls: 'Uncertain / Ambiguous Event', score: '0.50', path: 'Slow (Stream 2 - Qwen2-VL)', badge: 'badge-slow' },
    { lat: 21.60967, lng: 77.19474, id: 'CLST_202604_N20_31792', cls: 'Uncertain / Ambiguous Event', score: '0.50', path: 'Slow (Stream 2 - Qwen2-VL)', badge: 'badge-slow' },
    { lat: 16.49757, lng: 80.72852, id: 'CLST_202604_N20_17757', cls: 'Uncertain / Ambiguous Event', score: '0.50', path: 'Slow (Stream 2 - Qwen2-VL)', badge: 'badge-slow' },
    { lat: 23.12361, lng: 76.09873, id: 'CLST_202604_N20_3212', cls: 'Uncertain / Ambiguous Event', score: '0.50', path: 'Slow (Stream 2 - Qwen2-VL)', badge: 'badge-slow' },
    { lat: 25.29499, lng: 75.79458, id: 'CLST_202604_N20_43267', cls: 'Uncertain / Ambiguous Event', score: '0.50', path: 'Slow (Stream 2 - Qwen2-VL)', badge: 'badge-slow' },
    { lat: 24.69905, lng: 76.29906, id: 'CLST_202604_N20_28170', cls: 'Uncertain / Ambiguous Event', score: '0.50', path: 'Slow (Stream 2 - Qwen2-VL)', badge: 'badge-slow' },
    { lat: 21.69208, lng: 82.03272, id: 'CLST_202604_N20_34474', cls: 'Uncertain / Ambiguous Event', score: '0.50', path: 'Slow (Stream 2 - Qwen2-VL)', badge: 'badge-slow' },
    { lat: 24.49636, lng: 77.57672, id: 'CLST_202604_N20_30201', cls: 'Uncertain / Ambiguous Event', score: '0.50', path: 'Slow (Stream 2 - Qwen2-VL)', badge: 'badge-slow' },
    { lat: 14.16669, lng: 78.58684, id: 'CLST_202604_N20_12405', cls: 'Uncertain / Ambiguous Event', score: '0.50', path: 'Slow (Stream 2 - Qwen2-VL)', badge: 'badge-slow' },
    { lat: 23.7228, lng: 78.28165, id: 'CLST_202604_N20_1113', cls: 'Uncertain / Ambiguous Event', score: '0.50', path: 'Slow (Stream 2 - Qwen2-VL)', badge: 'badge-slow' },
    { lat: 24.69528, lng: 76.26669, id: 'CLST_202604_N20_25812', cls: 'Uncertain / Ambiguous Event', score: '0.50', path: 'Slow (Stream 2 - Qwen2-VL)', badge: 'badge-slow' },
    { lat: 26.86518, lng: 83.40974, id: 'CLST_202604_N20_37962', cls: 'Uncertain / Ambiguous Event', score: '0.50', path: 'Slow (Stream 2 - Qwen2-VL)', badge: 'badge-slow' },
    { lat: 21.10368, lng: 78.01624, id: 'CLST_202604_N20_31773', cls: 'Uncertain / Ambiguous Event', score: '0.50', path: 'Slow (Stream 2 - Qwen2-VL)', badge: 'badge-slow' },
    { lat: 25.22438, lng: 81.68601, id: 'CLST_202604_N20_44259', cls: 'Uncertain / Ambiguous Event', score: '0.50', path: 'Slow (Stream 2 - Qwen2-VL)', badge: 'badge-slow' },
    { lat: 18.56326, lng: 79.08927, id: 'CLST_202604_N20_13306', cls: 'Uncertain / Ambiguous Event', score: '0.50', path: 'Slow (Stream 2 - Qwen2-VL)', badge: 'badge-slow' },
    { lat: 19.85941, lng: 76.30485, id: 'CLST_202604_N20_12523', cls: 'Uncertain / Ambiguous Event', score: '0.50', path: 'Slow (Stream 2 - Qwen2-VL)', badge: 'badge-slow' },
    { lat: 21.92105, lng: 83.35146, id: 'CLST_202604_N20_0954', cls: 'Persistent Industrial Activity', score: '0.85', path: 'Fast (Stream 1)', badge: 'badge-fast' },
    { lat: 23.63741, lng: 77.76313, id: 'CLST_202604_N20_38266', cls: 'Stubble Burning', score: '0.60', path: 'Slow (Stream 2 - Qwen2-VL)', badge: 'badge-slow' },
    { lat: 19.70376, lng: 83.9584, id: 'CLST_202604_N20_0677', cls: 'Wildfire / Forest Fire', score: '0.85', path: 'Fast (Stream 1)', badge: 'badge-fast' },
    { lat: 21.26875, lng: 79.49498, id: 'CLST_202604_N20_30843', cls: 'Persistent Industrial Activity', score: '0.75', path: 'Fast (Stream 1)', badge: 'badge-fast' }
];

        const bottomPanel = document.getElementById('bottom-panel');
        const tdId = document.getElementById('td-id');
        const tdCoords = document.getElementById('td-coords');
        const tdClass = document.getElementById('td-class');
        const tdScore = document.getElementById('td-score');
        const tdPath = document.getElementById('td-path');

        function closePanel() {
            bottomPanel.style.display = 'none';
            map.closePopup();
        }

        // Plot markers
        fireData.forEach(data => {
            const markerColor = colors[data.cls] || '#1F2937';
            
            const customIcon = L.divIcon({
                className: 'custom-marker',
                html: `<div style="width: 100%; height: 100%; border-radius: 50%; background-color: ${markerColor};"></div>`,
                iconSize: [15, 15],
                iconAnchor: [8, 8],
                popupAnchor: [0, -10]
            });

            const marker = L.marker([data.lat, data.lng], { icon: customIcon }).addTo(map);
            
            marker.bindPopup("Viewing this", { closeButton: false });

            marker.on('click', function (e) {
                this.openPopup();
                
                tdId.innerText = data.id;
                tdCoords.innerText = `${data.lat}, ${data.lng}`;
                tdClass.innerText = data.cls;
                tdScore.innerText = data.score;
                tdPath.innerHTML = `<span class="${data.badge}">${data.path}</span>`;
                
                bottomPanel.style.display = 'block';
            });
        });
