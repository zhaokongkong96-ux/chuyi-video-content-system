import oauthConfig from '../../../../../social/oauthConfig.js';

const { getOAuthRedirectUris } = oauthConfig;

export async function GET() {
  try {
    const { redirectUris } = getOAuthRedirectUris();
    return Response.json({
      status: 'ready_but_platform_auth_not_enabled',
      platform: 'xiaohongshu',
      redirect_uri: redirectUris.xiaohongshu,
      next_step: 'Configure Xiaohongshu client credentials and authorization URL before enabling account binding.',
    });
  } catch (error) {
    return Response.json({
      status: 'error',
      code: 'cloud_oauth_config_error',
      message: error instanceof Error ? error.message : String(error),
    }, { status: 500 });
  }
}
