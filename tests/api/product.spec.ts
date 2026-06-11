import { type APIResponse } from "@playwright/test";
import Ajv from "ajv";
import { apiTest as test, expect } from "../../src/fixtures/apiFixtures.js";
import { productEndpoints } from "../../src/api/endpoints/productEndpoints.js";
import apiData from "../../src/test-data/product-api.json" with { type: "json" };

interface Product {
  id: number;
  title: string;
  price: number;
  category: string;
  description: string;
  [key: string]: unknown;
}

interface ProductSchema {
  type: "object";
  properties: {
    id: { type: "number" };
    title: { type: "string" };
    price: { type: "number" };
    category: { type: "string" };
    description: { type: "string" };
  };
  required: Array<keyof Product>;
  additionalProperties: boolean;
}

const ajv = new Ajv();

const productSchema: ProductSchema = {
  type: "object",
  properties: {
    id: { type: "number" },
    title: { type: "string" },
    price: { type: "number" },
    category: { type: "string" },
    description: { type: "string" }
  },
  required: ["id", "title", "price", "category", "description"],
  // Allow other properties (like "image" or "rating") that the API might return
  additionalProperties: true 
};

test.describe("FakeStore API Tests", () => {
  test("Verify product details from FakeStore API", async ({ apiClient }) => {
    const endpoint = productEndpoints.byId(1);
    let response: APIResponse;
    let responseBody: Product;

    await test.step("Send GET request to the endpoint", async () => {
      response = await apiClient.get(endpoint);
    });

    await test.step("Verify the response status is 200", async () => {
      expect(response.status()).toBe(apiData.validProduct.expectedStatus);
      expect(response.ok()).toBeTruthy();
    });

    await test.step("Parse the response body", async () => {
      responseBody = await response.json();
    });

    await test.step("Validate the response contains required keys", async () => {
      expect(responseBody).toHaveProperty("id");
      expect(responseBody).toHaveProperty("title");
      expect(responseBody).toHaveProperty("price");
      expect(responseBody).toHaveProperty("category");
      expect(responseBody).toHaveProperty("description");
    });

    await test.step("Validate the data types using a JSON Schema (Ajv)", async () => {
      const validate = ajv.compile<Product>(productSchema);
      const valid = validate(responseBody);
      expect(valid, `Schema validation failed: ${ajv.errorsText(validate.errors)}`).toBe(true);
    });

    await test.step("Log the product title and price", async () => {
      console.log(`Product Title: ${responseBody.title}`);
      console.log(`Product Price: $${responseBody.price}`);
    });
  });

  test("Verify non-existent product does not return valid product details", async ({ apiClient }) => {
    const endpoint = productEndpoints.byId(999999);
    let response: APIResponse;
    let responseBody: unknown;

    await test.step("Send GET request for a non-existent product", async () => {
      response = await apiClient.get(endpoint);
    });

    await test.step("Verify the API responds without a server error", async () => {
      expect(response.status()).toBe(apiData.nonExistentProduct.expectedStatus);
    });

    await test.step("Parse the response body", async () => {
      const responseText = await response.text();
      responseBody = responseText ? JSON.parse(responseText) : null;
      console.log(`Negative test response: ${JSON.stringify(responseBody)}`);
    });

    await test.step("Validate the response is not a valid product object", async () => {
      expect(responseBody).toBeNull();

      const validate = ajv.compile<Product>(productSchema);
      const valid = validate(responseBody);
      expect(valid, "Non-existent product should not satisfy the product schema").toBe(false);
    });
  });

  test("Verify 404 response for an invalid API endpoint", async ({ apiClient }) => {
    const endpoint = productEndpoints.invalidRoute();
    let response: APIResponse;

    await test.step("Send GET request to a non-existent route", async () => {
      response = await apiClient.get(endpoint);
    });

    await test.step("Verify the response status is 404 Not Found", async () => {
      expect(response.status()).toBe(apiData.invalidRoute.expectedStatus);
      expect(response.ok()).toBeFalsy();
    });
  });

  test("Verify POST request with empty payload fails schema validation", async ({ apiClient }) => {
    const endpoint = productEndpoints.create();
    let response: APIResponse;
    let responseBody: unknown;

    await test.step("Send POST request with an empty JSON payload", async () => {
      response = await apiClient.post(endpoint, apiData.createProduct.emptyPayload);
    });

    await test.step("Validate the response does not satisfy the product schema", async () => {
      responseBody = await response.json();
      const validate = ajv.compile<Product>(productSchema);
      const valid = validate(responseBody);
      expect(valid, `Empty product should not satisfy schema. Errors: ${ajv.errorsText(validate.errors)}`).toBe(false);
    });
  });
});
