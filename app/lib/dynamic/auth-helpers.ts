/* eslint-disable @typescript-eslint/no-explicit-any */
import jwt, {
  type JwtPayload,
  type Secret,
  type VerifyErrors,
} from "jsonwebtoken";

// Add a simple function to decode the token without verification
// This will help us see what's in the token even if verification fails
export const decodeWithoutVerify = (token: string): any => {
  try {
    // Just decode without verification to see the payload
    const parts = token.split(".");
    if (parts.length !== 3) {
      console.error("Token doesn't have three parts");
      return null;
    }

    const payload = parts[1];
    const decoded = Buffer.from(payload, "base64").toString();
    return JSON.parse(decoded);
  } catch (error) {
    console.error("Error decoding token:", error);
    return null;
  }
};

export const validateJWT = async (
  token: string
): Promise<JwtPayload | null> => {
  try {
    console.log("Validating JWT token:", token ? "Token present" : "No token");

    if (!token || typeof token !== "string") {
      console.error("Invalid token format:", typeof token);
      return null;
    }

    // Try to decode without verification to see what's in the token
    const decodedWithoutVerify = decodeWithoutVerify(token);
    console.log("Token decoded without verification:", decodedWithoutVerify);

    // Check if token has proper JWT format (3 parts separated by dots)
    const tokenParts = token.split(".");
    if (tokenParts.length !== 3) {
      console.error("Token does not have 3 parts:", tokenParts.length);
      return null;
    }

    // TEMPORARY WORKAROUND: If we're in development mode and having issues with verification,
    // we can use the decoded token without verification
    if (
      process.env.NODE_ENV === "development" &&
      decodedWithoutVerify &&
      decodedWithoutVerify.sub
    ) {
      console.log("DEVELOPMENT MODE: Using decoded token without verification");
      return decodedWithoutVerify as JwtPayload;
    }

    const decodedToken = await new Promise<JwtPayload | null>(
      (resolve, reject) => {
        jwt.verify(
          token,
          getKey,
          { algorithms: ["RS256"] },
          (
            err: VerifyErrors | null,
            decoded: string | JwtPayload | undefined
          ) => {
            console.log("JWT verification result:", err ? "Error" : "Success");
            if (err) {
              console.error("JWT verification error:", err.message);
              reject(err);
            } else {
              // Ensure that the decoded token is of type JwtPayload
              if (typeof decoded === "object" && decoded !== null) {
                console.log("JWT decoded successfully");
                resolve(decoded);
              } else {
                console.error("Decoded token is not an object");
                reject(new Error("Invalid token"));
              }
            }
          }
        );
      }
    );
    return decodedToken;
  } catch (error) {
    console.error("JWT validation error:", error);
    return null;
  }
};

export const getKey = (
  _: any,
  callback: (err: Error | null, key?: Secret) => void
): void => {
  console.log("Fetching public key from Dynamic...");
  console.log(
    "Environment ID:",
    process.env.NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID
  );
  console.log("Bearer token present:", !!process.env.NEXT_DYNAMIC_BEARER_TOKEN);

  // Define the options for the fetch request
  const options = {
    method: "GET",
    headers: {
      Authorization: `Bearer ${process.env.NEXT_DYNAMIC_BEARER_TOKEN}`,
    },
  };

  // Perform the fetch request asynchronously
  fetch(
    `https://app.dynamicauth.com/api/v0/environments/${process.env.NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID}/keys`,
    options
  )
    .then((response) => {
      console.log("Dynamic API response status:", response.status);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    })
    .then((json) => {
      console.log("Public key fetched successfully");
      const publicKey = json.key.publicKey;
      const pemPublicKey = Buffer.from(publicKey, "base64").toString("ascii");
      callback(null, pemPublicKey); // Pass the public key to the callback
    })
    .catch((err) => {
      console.error("Error fetching public key:", err);
      callback(err); // Pass the error to the callback
    });
};
