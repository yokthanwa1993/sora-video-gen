# CapRover Deployment Guide

## Prerequisites

- CapRover server up and running
- Domain configured for your app
- Environment variables ready

## Deployment Steps

### 1. Create New App in CapRover

1. Login to your CapRover dashboard
2. Go to "Apps" → "One-Click Apps/Databases"
3. Click "Create New App"
4. Enter app name (e.g., `sora-video-gen`)
5. Click "Create New App"

### 2. Configure Environment Variables

In the app settings, add these environment variables:

```
MUAPIAPP_API_KEY=your_muapi_api_key
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
PORT=80
```

**Important**: Set `PORT=80` for CapRover (not 8787)

### 3. Deploy from GitHub

#### Option A: Deploy from GitHub Repository

1. In app settings, go to "Deployment" tab
2. Select "Method 3: Deploy from Github/Bitbucket/Gitlab"
3. Enter repository details:
   - Repository: `https://github.com/yokthanwa1993/sora-video-gen`
   - Branch: `main`
4. Click "Save & Update"

#### Option B: Deploy via Captain CLI

```bash
# Install Captain CLI
npm install -g caprover

# Login to your CapRover
caprover login

# Deploy
caprover deploy
```

When prompted:
- Select your CapRover server
- Enter app name: `sora-video-gen`
- Branch: `main`

### 4. Enable HTTPS

1. Go to "HTTP Settings" in app dashboard
2. Enable "HTTPS"
3. Check "Force HTTPS by redirecting all HTTP traffic to HTTPS"
4. Click "Save & Update"

### 5. Configure Domain (Optional)

1. Go to "HTTP Settings"
2. Add your custom domain
3. Enable "HTTPS" for the domain
4. Update DNS records to point to your CapRover server

### 6. Verify Deployment

1. Visit your app URL: `https://sora-video-gen.your-domain.com`
2. Check logs in CapRover dashboard for any errors
3. Test login with Google OAuth
4. Try generating a video

## Troubleshooting

### Build Fails

- Check if all required files exist in repository
- Verify `Dockerfile` and `captain-definition` are present
- Check build logs in CapRover dashboard

### App Crashes on Start

- Verify all environment variables are set correctly
- Check app logs in CapRover dashboard
- Ensure `PORT=80` is set

### OAuth Not Working

- Verify Google OAuth redirect URL includes your CapRover domain
- Update Supabase Auth settings with new domain
- Check that HTTPS is enabled

### Database Connection Issues

- Verify `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are correct
- Check if `SUPABASE_SERVICE_ROLE_KEY` is set for background updates
- Test connection from CapRover app logs

## Updating the App

### Method 1: Git Push (Recommended)

```bash
git add .
git commit -m "Update feature"
git push
```

CapRover will automatically rebuild and redeploy.

### Method 2: Manual Rebuild

1. Go to app dashboard in CapRover
2. Click "Deployment" tab
3. Click "Force Rebuild"

## Performance Optimization

### Enable Docker Registry Cache

1. In CapRover, enable Docker Registry
2. This speeds up subsequent builds

### Resource Limits

Recommended settings:
- Memory: 512MB minimum, 1GB recommended
- CPU: 0.5 cores minimum

Configure in app settings → "App Configs"

## Monitoring

### View Logs

```bash
caprover logs -a sora-video-gen -f
```

Or view in CapRover dashboard → "App Logs"

### Health Check

The app includes `/api/health` endpoint for monitoring:

```bash
curl https://sora-video-gen.your-domain.com/api/health
```

Should return:
```json
{"ok": true, "provider": "muapi.ai"}
```

## Backup

### Database Backups

Supabase handles database backups automatically. Configure backup schedule in Supabase dashboard.

### Environment Variables Backup

Export environment variables from CapRover and store securely:

```bash
# In CapRover dashboard, copy all env vars
# Store in password manager or secure location
```

## Scaling

For high traffic:

1. **Vertical Scaling**: Increase memory/CPU in app settings
2. **Horizontal Scaling**: Enable "Instance Count" in CapRover
3. **Database**: Upgrade Supabase plan for better performance

## Support

- CapRover Documentation: https://caprover.com/docs/
- Repository Issues: https://github.com/yokthanwa1993/sora-video-gen/issues
