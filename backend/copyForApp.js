import fs from 'fs';
import path from 'path';

const backendDir = process.cwd();
const controllersDir = path.join(backendDir, 'controllers');
const routesDir = path.join(backendDir, 'routes');

const appControllersDir = path.join(controllersDir, 'app');
const appRoutesDir = path.join(routesDir, 'app');

// Create directories
if (!fs.existsSync(appControllersDir)) fs.mkdirSync(appControllersDir, { recursive: true });
if (!fs.existsSync(appRoutesDir)) fs.mkdirSync(appRoutesDir, { recursive: true });

// Duplicate controllers and fix imports
fs.readdirSync(controllersDir).forEach(file => {
    if (file.endsWith('.js') && !file.includes('app')) {
        let content = fs.readFileSync(path.join(controllersDir, file), 'utf8');
        // Fix imports starting with '../' to '../../'
        content = content.replace(/from\s+['"]\.\.\/(.*?)['"]/g, "from '../../$1'");
        fs.writeFileSync(path.join(appControllersDir, file), content);
    }
});

// Duplicate routes and fix imports
fs.readdirSync(routesDir).forEach(file => {
    if (file.endsWith('.js') && !file.includes('app')) {
        let content = fs.readFileSync(path.join(routesDir, file), 'utf8');
        // Fix controller imports: '../controllers/' to '../../controllers/app/'
        content = content.replace(/from\s+['"]\.\.\/controllers\/(.*?)['"]/g, "from '../../controllers/app/$1'");
        // Fix other relative imports (middleware, etc.)
        content = content.replace(/from\s+['"]\.\.\/(middleware|utils|services|config)\/(.*?)['"]/g, "from '../../$1/$2'");
        fs.writeFileSync(path.join(appRoutesDir, file), content);
    }
});

console.log('App files duplicated successfully!');
