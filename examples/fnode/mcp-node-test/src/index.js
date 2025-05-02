// Model - Handles data and business logic
class UserProfileModel {
  constructor(userData = {}) {
    this.username = userData.username || '';
    this.email = userData.email || '';
    this.age = userData.age || null;
    this.preferences = {
      theme: userData.preferences?.theme || 'system',
      notifications: userData.preferences?.notifications !== undefined ? userData.preferences.notifications : true,
      language: userData.preferences?.language || 'en'
    };
  }

  validate() {
    const errors = [];

    // Username validation
    if (!this.username) {
      errors.push('Username is required');
    } else if (this.username.length < 3) {
      errors.push('Username must be at least 3 characters');
    } else if (this.username.length > 50) {
      errors.push('Username must be less than 50 characters');
    }

    // Email validation
    if (!this.email) {
      errors.push('Email is required');
    } else if (!this.validateEmail(this.email)) {
      errors.push('Email format is invalid');
    }

    // Age validation
    if (this.age !== null) {
      if (this.age < 18) {
        errors.push('Age must be at least 18');
      } else if (this.age > 120) {
        errors.push('Age must be less than 120');
      }
    }

    // Theme validation
    const validThemes = ['light', 'dark', 'system'];
    if (!validThemes.includes(this.preferences.theme)) {
      errors.push('Theme must be one of: light, dark, system');
    }

    // Language validation
    const validLanguages = ['en', 'tr', 'es', 'fr', 'de'];
    if (!validLanguages.includes(this.preferences.language)) {
      errors.push('Language must be one of: en, tr, es, fr, de');
    }

    return errors;
  }

  validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  }

  toJSON() {
    return {
      username: this.username,
      email: this.email,
      age: this.age,
      preferences: this.preferences
    };
  }
}

// Controller - Handles user input and coordinates between Model and Presenter
class UserProfileController {
  constructor(model, presenter) {
    this.model = model;
    this.presenter = presenter;
  }

  processUserInput(userData) {
    // Update model with user data
    this.model.username = userData.username || this.model.username;
    this.model.email = userData.email || this.model.email;
    this.model.age = userData.age !== undefined ? userData.age : this.model.age;

    if (userData.preferences) {
      this.model.preferences.theme = userData.preferences.theme || this.model.preferences.theme;
      this.model.preferences.notifications = userData.preferences.notifications !== undefined
        ? userData.preferences.notifications
        : this.model.preferences.notifications;
      this.model.preferences.language = userData.preferences.language || this.model.preferences.language;
    }

    // Validate the model
    const validationErrors = this.model.validate();

    if (validationErrors.length > 0) {
      // If there are validation errors, tell the presenter to show them
      this.presenter.showValidationErrors(validationErrors);
      return false;
    } else {
      // If validation passes, tell the presenter to show success
      this.presenter.showSuccess(this.model.toJSON());
      return true;
    }
  }

  getProfileData() {
    return this.model.toJSON();
  }
}

// Presenter - Handles UI updates and user interaction
class UserProfilePresenter {
  constructor() {
    this.output = null;
  }

  showValidationErrors(errors) {
    this.output = {
      status: 'error',
      message: 'Validation failed',
      errors: errors
    };
    // console.error('Validation errors:', errors);
  }

  showSuccess(profileData) {
    this.output = {
      status: 'success',
      message: 'Profile updated successfully',
      data: profileData
    };
    // console.log('Profile updated successfully:', profileData);
  }

  getOutput() {
    return this.output;
  }
}

// Main function that will be called by the framework
export default async (args) => {
  // Create instances of our MCP components
  const model = new UserProfileModel(args);
  const presenter = new UserProfilePresenter();
  const controller = new UserProfileController(model, presenter);

  // Process the input
  controller.processUserInput(args);

  // Return the presenter's output
  return presenter.getOutput();
}