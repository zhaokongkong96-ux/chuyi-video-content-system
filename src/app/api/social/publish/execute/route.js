import oauthConfig from '../../../../../social/oauthConfig.js';
import publishExecute from '../../../../../social/publishExecute.js';

const { getOAuthRedirectUris } = oauthConfig;
const { executePublish } = publishExecute;

export async function POST(request) {
  try {
    getOAuthRedirectUris();
    const body = await request.json();
    const result = await executePublish(body);
    return Response.json(result.body, { status: result.statusCode });
  } catch (error) {
    return Response.json({
      status: 'error',
      code: 'cloud_oauth_config_error',
      message: error.message,
    }, { status: 500 });
  }
}
