import { getOAuthRedirectUris } from '../../../../../social/oauthConfig.js';

export async function GET(request: Request) {
  try {
    getOAuthRedirectUris();
    const url = new URL(request.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');

    if (!code || !state) {
      return Response.json({
        status: 'error',
        code: 'oauth_callback_missing_params',
        platform: 'douyin',
        message: 'Douyin callback must be visited by the platform with code and state parameters.',
      }, { status: 400 });
    }

    return Response.json({
      status: 'oauth_callback_received',
      platform: 'douyin',
      code_received: true,
      state_received: true,
      next_step: 'Exchange code for access token after platform credentials are configured.',
    });
  } catch (error) {
    return Response.json({
      status: 'error',
      code: 'cloud_oauth_config_error',
      message: error instanceof Error ? error.message : String(error),
    }, { status: 500 });
  }
}
