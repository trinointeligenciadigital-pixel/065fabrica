export default {
  providers: [
    {
      domain: process.env.CLERK_JWT_ISSUER_DOMAIN || "https://superb-shrew-77.clerk.accounts.dev",
      applicationID: "convex",
    },
  ],
};
