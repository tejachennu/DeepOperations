# API Network Error Troubleshooting Guide

## What you've set up:
✅ **Enhanced API error handling** with detailed network diagnostics  
✅ **Improved error messages** showing network issues vs server errors  
✅ **Environment variable support** for flexible API configuration  
✅ **Better logging** in browser console for debugging  

## Common Network Errors and Solutions:

### 1. **"Network Error: Cannot connect to API server"**
**Cause**: API server is unreachable or CORS issues
**Solutions**:
- ✅ Verify the API is running at `https://deepapiservice.azurewebsites.net`
- ✅ Check browser console (F12) for detailed error messages
- ✅ Try accessing `https://deepapiservice.azurewebsites.net/api/auth/profile` directly in browser
- ✅ Ensure your firewall allows HTTPS connections

### 2. **"Request timeout - API server not responding"**
**Cause**: API takes too long to respond (>30 seconds)
**Solutions**:
- ✅ Check API server status in Azure Portal
- ✅ Verify network latency: `ping deepapiservice.azurewebsites.net`
- ✅ Try switching to local API if available

### 3. **"Failed to fetch" / CORS Error**
**Cause**: Cross-Origin Resource Sharing issue
**Solutions**:
- ✅ Ensure API has CORS enabled for your domain
- ✅ Check API CORS configuration in Azure App Service
- ✅ Allowed origins should include: `http://localhost:3000` (dev), `localhost:5000` (if local)

### 4. **API endpoint not found (404)**
**Cause**: Wrong API path or base URL
**Solutions**:
- ✅ Check API_BASE_URL in `.env.local` file
- ✅ Verify endpoint paths in `src/services/api.js`

## Configuration Options:

### Use Production API (Default):
```
REACT_APP_API_BASE_URL=https://deepapiservice.azurewebsites.net/api
```

### Use Local Development API:
1. Edit `.env.local`
2. Uncomment: `REACT_APP_API_BASE_URL=http://localhost:5000/api`
3. Restart the app: `npm start`

## Debug Mode:

To see detailed API logs in browser console:
1. Open DevTools: `F12` or `Right-click → Inspect`
2. Go to Console tab
3. Look for 🔗 🔑 ❌ emojis for API calls

## Browser Console Messages:
- `🔗 API Base URL: ...` → Current API endpoint
- `🔑 Unauthorized - redirecting to login` → Authentication issue
- `❌ Network Error: ...` → Connection problem
- `🕐 Request timeout` → Server not responding
- `📡 CORS or network connectivity issue` → Firewall/CORS issue

## Quick Checklist:
- [ ] API server is running and accessible
- [ ] Check network connection (WiFi, VPN, Firewall)
- [ ] Verify API_BASE_URL in `.env.local`
- [ ] Check browser console for detailed error
- [ ] Clear cache: Ctrl+Shift+Delete (Chrome)
- [ ] Try different API endpoint
- [ ] Check API CORS settings in Azure
- [ ] Verify authentication token if needed

## Still Having Issues?
1. Check browser console (F12 → Console tab)
2. Check Network tab to see failed requests
3. Verify API endpoint directly in browser
4. Check Azure App Service logs
5. Restart development server: `npm start`
