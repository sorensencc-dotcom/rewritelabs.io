import globals from "globals";

export default [

  // ============================
  // Backend / Node environment
  // ============================
  {
    files: [
      "**/*.js",
      "!engine/operatorConsole/**/*",
      "!engine/operatorConsole-backup-20260414-011236/**/*"
    ],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.node,
      }
    },
    rules: {
      "no-unused-vars": "warn",
      "no-undef": "off",        // Node globals handled above
      "semi": ["error", "always"]
    }
  },

  // ============================
  // Frontend / Browser environment
  // ============================
  {
    files: [
      "engine/operatorConsole/**/*.js",
      "engine/operatorConsole-backup-20260414-011236/**/*.js"
    ],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.browser,
      }
    },
    rules: {
      "no-unused-vars": "warn",
      "no-undef": "off",        // Browser globals handled above
      "semi": ["error", "always"]
    }
  },

  // ============================
  // CommonJS modules
  // ============================
  {
    files: [
      "engine/category/**/*.js",
      "engine/osm/**/*.js"
    ],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "script",
      globals: {
        ...globals.node,
      }
    },
    rules: {
      "no-unused-vars": "warn",
      "no-undef": "off",
      "semi": ["error", "always"]
    }
  }
];
