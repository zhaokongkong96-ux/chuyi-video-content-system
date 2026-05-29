import { getOAuthRedirectUris } from '../../../../../social/oauthConfig.js';

export async function GET() {
  try {
    const { redirectUris } = getOAuthRedirectUris();
    return Response.json({
      status: 'ready_but_platform_auth_not_enabled',
      platform: 'douyin',
      redirect_uri: redirectUris.douyin,
      next_step: 'Configure Douyin client credentials and authorization URL before enabling account binding.',
    });
  } catch (error) {
    return Response.json({
      status: 'error',
      code: 'cloud_oauth_config_error',
      message: error instanceof Error ? error.message : String(error),
    }, { status: 500 });
  }
}
