/**
 * ConfigLoader - Loads and validates JSON configuration files
 */
export class ConfigLoader {
  /**
   * Load and parse JSON configuration from a path
   * @param {string} path - Path to configuration file
   * @returns {Promise<Object>} Parsed configuration object
   */
  static async loadConfig(path) {
    try {
      const response = await fetch(path);
      if (!response.ok) {
        throw new Error(`Failed to load configuration from ${path}: ${response.status} ${response.statusText}`);
      }
      const config = await response.json();
      return config;
    } catch (error) {
      if (error.message.includes('Failed to load configuration')) {
        throw error;
      }
      throw new Error(`Failed to parse configuration from ${path}: ${error.message}`);
    }
  }

  /**
   * Validate configuration against a schema
   * @param {Object} config - Configuration object to validate
   * @param {Object} schema - Schema to validate against
   * @returns {Object} Validation result with { valid: boolean, errors: Array }
   */
  static validateConfig(config, schema) {
    const errors = [];

    // Helper function to validate a value against a schema field
    const validateField = (value, fieldSchema, path) => {
      // Check required fields
      if (fieldSchema.required && (value === undefined || value === null)) {
        errors.push(`Missing required field: ${path}`);
        return;
      }

      // If field is optional and not present, skip validation
      if (value === undefined || value === null) {
        return;
      }

      // Check type
      if (fieldSchema.type) {
        const actualType = Array.isArray(value) ? 'array' : typeof value;
        if (actualType !== fieldSchema.type) {
          errors.push(`Invalid type for field ${path}: expected ${fieldSchema.type}, got ${actualType}`);
          return;
        }
      }

      // Check enum values
      if (fieldSchema.enum && !fieldSchema.enum.includes(value)) {
        errors.push(`Invalid value for field ${path}: must be one of [${fieldSchema.enum.join(', ')}], got ${JSON.stringify(value)}`);
        return;
      }

      // Check min/max for numbers
      if (typeof value === 'number') {
        if (fieldSchema.min !== undefined && value < fieldSchema.min) {
          errors.push(`Value for field ${path} is below minimum: expected >= ${fieldSchema.min}, got ${value}`);
        }
        if (fieldSchema.max !== undefined && value > fieldSchema.max) {
          errors.push(`Value for field ${path} exceeds maximum: expected <= ${fieldSchema.max}, got ${value}`);
        }
      }

      // Check minLength/maxLength for strings
      if (typeof value === 'string') {
        if (fieldSchema.minLength !== undefined && value.length < fieldSchema.minLength) {
          errors.push(`String length for field ${path} is below minimum: expected >= ${fieldSchema.minLength} characters, got ${value.length}`);
        }
        if (fieldSchema.maxLength !== undefined && value.length > fieldSchema.maxLength) {
          errors.push(`String length for field ${path} exceeds maximum: expected <= ${fieldSchema.maxLength} characters, got ${value.length}`);
        }
      }

      // Check array items
      if (Array.isArray(value) && fieldSchema.items) {
        value.forEach((item, index) => {
          validateField(item, fieldSchema.items, `${path}[${index}]`);
        });
      }

      // Check object properties
      if (fieldSchema.properties && typeof value === 'object' && !Array.isArray(value)) {
        for (const [key, propSchema] of Object.entries(fieldSchema.properties)) {
          validateField(value[key], propSchema, `${path}.${key}`);
        }
      }
    };

    // Start validation from root
    if (schema.properties) {
      for (const [key, fieldSchema] of Object.entries(schema.properties)) {
        validateField(config[key], fieldSchema, key);
      }
    }

    return {
      valid: errors.length === 0,
      errors: errors
    };
  }

  /**
   * Deep merge two configuration objects
   * @param {Object} base - Base configuration
   * @param {Object} override - Override configuration
   * @returns {Object} Merged configuration
   */
  static mergeConfigs(base, override) {
    // Handle null/undefined cases
    if (!base) return override;
    if (!override) return base;

    // Create a deep copy of base to avoid mutation
    const result = JSON.parse(JSON.stringify(base));

    // Helper function to merge objects recursively
    const merge = (target, source) => {
      for (const key in source) {
        if (source.hasOwnProperty(key)) {
          const sourceValue = source[key];
          const targetValue = target[key];

          // If both are objects (and not arrays), merge recursively
          if (
            sourceValue &&
            typeof sourceValue === 'object' &&
            !Array.isArray(sourceValue) &&
            targetValue &&
            typeof targetValue === 'object' &&
            !Array.isArray(targetValue)
          ) {
            target[key] = merge(targetValue, sourceValue);
          } else {
            // Otherwise, override with source value
            target[key] = sourceValue;
          }
        }
      }
      return target;
    };

    return merge(result, override);
  }

  /**
   * Serialize configuration to JSON string
   * @param {Object} config - Configuration object
   * @returns {string} JSON string
   */
  static serializeConfig(config) {
    return JSON.stringify(config);
  }

  /**
   * Parse JSON string to configuration object
   * @param {string} jsonString - JSON string
   * @returns {Object} Parsed configuration object
   */
  static parseConfig(jsonString) {
    return JSON.parse(jsonString);
  }
}
