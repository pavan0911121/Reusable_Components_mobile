import { Alert } from 'react-native';
import { Keys, getData, storeData } from '../AsyncStore';
import { AUTH_ENDPOINTS } from '../Networking/EndPoints';

let tokenRefreshPromise: Promise<string | null> | null = null;
const API_KEY = 'sb_publishable_tY1AthKjAKBTZP0TxJ1KfQ_PCL8VdIk';

// Type definitions
interface HeadersConfig {
  [key: string]: string;
}

interface RequestConfig {
  method: string;
  headers: HeadersConfig;
  body?: string | FormData;
}

interface APIResponse {
  success: boolean;
  data?: any;
  status?: number;
}

export const refreshAccessToken = (): Promise<string | null> => {
  if (!tokenRefreshPromise) {
    tokenRefreshPromise = (async () => {
      const refreshToken = await getData(Keys.REFRESH_TOKEN);
      if (!refreshToken) {
        return null;
      }

      const response = await fetch(AUTH_ENDPOINTS.refreshToken, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          apikey: API_KEY,
        },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });
      const { data } = await parseAPIResponse(response);
      if (typeof data?.access_token !== 'string' || !data.access_token) {
        throw new Error('Token refresh response is missing an access token');
      }

      if (data.refresh_token) {
        await storeData(Keys.REFRESH_TOKEN, data.refresh_token);
      }
      await storeData(Keys.USER_TOKEN, data.access_token);
      return data.access_token;
    })().finally(() => {
      tokenRefreshPromise = null;
    });
  }
  return tokenRefreshPromise;
};

/**
 * Main HTTP Client function for API calls
 * @param {string | null} authToken - Authorization token
 * @param {string} url - API endpoint URL
 * @param {string} methodType - HTTP method (GET, POST, PUT, DELETE)
 * @param {any} body - Request body
 * @param {object} customConfig - Custom headers configuration
 * @param {boolean} isValidate - Whether to validate token and refresh if needed
 */
export const client = async (
  authToken: string | null,
  url: string,
  methodType: string,
  body: any = null,
  customConfig: HeadersConfig = {},
  isValidate: boolean = true
): Promise<any> => {
  const isAuthEndpoint = url.startsWith(AUTH_ENDPOINTS.login.split('?')[0]) ||
    url.startsWith(AUTH_ENDPOINTS.register.split('?')[0]);
  const canRefresh = isValidate && !isAuthEndpoint;
  if (canRefresh) {
    if (tokenRefreshPromise) {
      await tokenRefreshPromise;
    }
    authToken = (await getData(Keys.USER_TOKEN)) || authToken;
  }
  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;

  const headers: HeadersConfig = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    'apikey': API_KEY,
    ...customConfig,
  };

  // Let fetch set the multipart boundary itself when sending FormData
  if (isFormData) {
    delete headers['Content-Type'];
  }

  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  const config: RequestConfig = {
    method: methodType,
    headers,
  };

  if (body != null && (methodType === 'POST' || methodType === 'PUT' || methodType === 'PATCH' || methodType === 'DELETE')) {
    config.body = isFormData ? body : JSON.stringify(body);
  }

  try {
    let response = await fetch(url, config);

    if (response.status === 401 && canRefresh) {
      const requestPath = url.split('?')[0];
      console.warn(`API returned 401: ${methodType} ${requestPath}`);
      const storedToken = await getData(Keys.USER_TOKEN);
      const newToken = tokenRefreshPromise
        ? await tokenRefreshPromise
        : storedToken && storedToken !== authToken
          ? storedToken
          : await refreshAccessToken();

      if (newToken) {
        const retryConfig = {
          ...config,
          headers: { ...headers, Authorization: `Bearer ${newToken}` },
        };
        console.info(`Retrying API after token refresh: ${methodType} ${requestPath}`);
        response = await fetch(url, retryConfig);
      }
    }

    // Handle 401 for login API (invalid credentials) - only show alert for login endpoints
    if (response.status === 401 && url === AUTH_ENDPOINTS.login) {
      try {
        const errData = await response.clone().json();
        Alert.alert('Login Failed', errData.message || 'Invalid credentials', [
          { text: 'OK', onPress: () => console.log('OK Pressed') },
        ]);
      } catch {
        Alert.alert('Login Failed', 'Invalid credentials', [
          { text: 'OK', onPress: () => console.log('OK Pressed') },
        ]);
      }
    }

    return response;
  } catch (err) {
    return Promise.reject(err);
  }
};

/**
 * GET request
 */
client.get = async function (endpoint: string, customConfig: HeadersConfig = {}, isValidate: boolean = true): Promise<APIResponse> {
  const token = await getData(Keys.USER_TOKEN);
  const response = await client(token, endpoint, 'GET', null, customConfig, isValidate);
  return parseAPIResponse(response);
};

/**
 * POST request
 */
client.post = async function (endpoint: string, body: any, customConfig: HeadersConfig = {}, isValidate: boolean = true): Promise<APIResponse> {
  const token = await getData(Keys.USER_TOKEN);
  const response = await client(token, endpoint, 'POST', body, customConfig, isValidate);

  return parseAPIResponse(response);
};

/**
 * PUT request
 */
client.put = async function (endpoint: string, body: any, customConfig: HeadersConfig = {}, isValidate: boolean = true): Promise<APIResponse> {
  const token = await getData(Keys.USER_TOKEN);
  const response = await client(token, endpoint, 'PUT', body, customConfig, isValidate);
  return parseAPIResponse(response);
};

/**
 * DELETE request
 */
client.delete = async function (endpoint: string, body: any = null, customConfig: HeadersConfig = {}, isValidate: boolean = true): Promise<APIResponse> {
  const token = await getData(Keys.USER_TOKEN);
  const response = await client(token, endpoint, 'DELETE', body, customConfig, isValidate);
  return parseAPIResponse(response);
};

/**
 * Parse API response and convert to standardized format
 * Handles both successful and error responses
 */
export const parseAPIResponse = async (response: Response): Promise<APIResponse> => {
  try {
    const responseText = await response.text();

    if (!responseText) {
      if (response.ok) {
        return { success: true, data: null };
      }
      throw {
        type: 'EmptyResponse',
        status: response.status,
        message: 'Empty response from server',
      };
    }

    const parsedJSON = JSON.parse(responseText);

    if (response.ok) {
      //console.log(`✓ API Response successful [${response.status}]`);
      return { success: true, data: parsedJSON, status: response.status };
    }

    // Handle server errors (5xx)
    if (response.status >= 500) {
      console.error(`✗ Server Error [${response.status}]:`, parsedJSON);
      throw {
        type: 'ServerError',
        status: response.status,
        message: 'Server error occurred',
        body: parsedJSON,
      };
    }

    // Handle client errors (4xx)
    if (response.status >= 400) {
      console.error(`✗ Application Error [${response.status}]:`, parsedJSON);
      throw {
        type: 'ApplicationError',
        status: response.status,
        message: parsedJSON.message || 'Request failed',
        body: parsedJSON,
      };
    }

    return { success: false, data: parsedJSON, status: response.status };
  } catch (err) {
    if (err !== null && typeof err === 'object' && 'type' in err) {
      return Promise.reject(err);
    }

    const errorBody = err instanceof Error ? err.message : String(err);
    console.error('JSON Parse Error:232', errorBody);
    return Promise.reject({
      type: 'InvalidJSON',
      status: response.status,
      message: (err as any)?.body?.msg || 'Failed to parse response',
      body: errorBody,
    });
  }
};

export default client;
