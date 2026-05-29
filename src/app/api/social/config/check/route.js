import oauthConfig from '../../../../../social/oauthConfig.js';

const { getOAuthRedirectUris } = oauthConfig;

export async function GET() {
  try {
    const config = getOAuthRedirectUris();
    return Response.json({
      status: 'ok',
      app_url: config.appUrl,
      redirect_uris: config.redirectUris,
      content_storage_mode: process.env.CONTENT_STORAGE_MODE || 'cloud',
      social_publish_api_enabled: process.env.SOCIAL_PUBLISH_API_ENABLED === 'true',
    });
  } catch (error) {
    return Response.json({
      status: 'error',
      code: 'cloud_oauth_config_error',
      message: error.message,
    }, { status: 500 });
  }
}
