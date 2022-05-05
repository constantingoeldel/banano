module.exports = {
  verbose: true,
  transform: {
    '^.+\\.tsx?$': ['@swc/jest'],
  },
  testPathIgnorePatterns: ["/node_modules/", "/.next/", "/*.tsx", "/*spec.js"],
}

