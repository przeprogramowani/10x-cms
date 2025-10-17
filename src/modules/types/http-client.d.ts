declare module "@10xdevspl/http-client" {
  export interface HttpClientResponse {
    status: number;
    data: any;
    headers: Record<string, string>;
  }

  export interface HttpClient {
    post(
      url: string,
      data: any,
      headers?: Record<string, string>
    ): Promise<HttpClientResponse>;
    get(url: string, headers?: Record<string, string>): Promise<HttpClientResponse>;
    put(
      url: string,
      data: any,
      headers?: Record<string, string>
    ): Promise<HttpClientResponse>;
    delete(
      url: string,
      headers?: Record<string, string>
    ): Promise<HttpClientResponse>;
  }

  const httpClient: HttpClient;
  export default httpClient;
}
