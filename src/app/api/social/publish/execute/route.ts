import { getOAuthRedirectUris } from '../../../../../social/oauthConfig.js';
import { executePublish } from '../../../../../social/publishExecute.js';

export async function POST(request: Request) {
  try {
    getOAuthRedirectUris();
    const body = await request.json();
    const result = await executePublish(body);
    return Response.json(result.body, { status: result.statusCode });
  } catch (error) {
    return Response.json({
      status: 'error',
      code: 'cloud_oauth_config_error',
      message: error instanceof Error ? error.message : String(error),
    }, { status: 500 });
  }
}
