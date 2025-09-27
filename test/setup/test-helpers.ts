import * as request from 'supertest';
import { TestSetup } from './test-setup';

export class TestHelpers {
  constructor(private readonly testSetup: TestSetup) {}

  /**
   * Helper method to make authenticated GET requests
   */
  async authGet(url: string, token?: string) {
    const authToken = token || this.testSetup.authToken;
    return request(this.testSetup.getHttpServer())
      .get(url)
      .set('Authorization', `Bearer ${authToken}`);
  }

  /**
   * Helper method to make authenticated POST requests
   */
  async authPost(url: string, data: any, token?: string) {
    const authToken = token || this.testSetup.authToken;
    return request(this.testSetup.getHttpServer())
      .post(url)
      .set('Authorization', `Bearer ${authToken}`)
      .send(data);
  }

  /**
   * Helper method to make authenticated PUT requests
   */
  async authPut(url: string, data: any, token?: string) {
    const authToken = token || this.testSetup.authToken;
    return request(this.testSetup.getHttpServer())
      .put(url)
      .set('Authorization', `Bearer ${authToken}`)
      .send(data);
  }

  /**
   * Helper method to make authenticated PATCH requests
   */
  async authPatch(url: string, data: any, token?: string) {
    const authToken = token || this.testSetup.authToken;
    return request(this.testSetup.getHttpServer())
      .patch(url)
      .set('Authorization', `Bearer ${authToken}`)
      .send(data);
  }

  /**
   * Helper method to make authenticated DELETE requests
   */
  async authDelete(url: string, token?: string) {
    const authToken = token || this.testSetup.authToken;
    return request(this.testSetup.getHttpServer())
      .delete(url)
      .set('Authorization', `Bearer ${authToken}`);
  }

  /**
   * Helper method to make unauthenticated GET requests
   */
  async publicGet(url: string) {
    return request(this.testSetup.getHttpServer()).get(url);
  }

  /**
   * Helper method to make unauthenticated POST requests
   */
  async publicPost(url: string, data: any) {
    return request(this.testSetup.getHttpServer()).post(url).send(data);
  }

  /**
   * Helper to check standard API response format
   */
  expectStandardResponse(response: any) {
    expect(response.body).toHaveProperty('success');
    if (response.body.success) {
      expect(response.body).toHaveProperty('data');
    } else {
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('code');
      expect(response.body.error).toHaveProperty('message');
    }
  }
}