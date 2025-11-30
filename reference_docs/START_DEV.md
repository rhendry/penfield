# Development Server - Quick Start

## Clean startup (run this if things are acting weird):

```bash
# 1. Kill any existing processes
pkill -9 -f "tsx server" && pkill -9 -f "npm run dev"

# 2. Clear Vite cache
rm -rf node_modules/.vite client/.vite

# 3. Clear port 5000
lsof -ti:5000 | xargs kill -9 2>/dev/null || echo "Port clear"

# 4. Start dev server
npm run dev
```

## Normal startup:

```bash
npm run dev
```

Server will be at: **http://localhost:5000**

## If you see errors:
- Check that only ONE process is running: `ps aux | grep "tsx server"`
- Check port 5000 is free: `lsof -i:5000`
- Clear browser cache and hard refresh (Ctrl+Shift+R)

