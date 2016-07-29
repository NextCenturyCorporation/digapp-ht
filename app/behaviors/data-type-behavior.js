/* globals DigBehaviors */
/* exported DigBehaviors */
var DigBehaviors = DigBehaviors || {};

/**
 * Polymer behavior for data types in this application.
 */
DigBehaviors.DataTypeBehavior = {
  /**
   * Returns the style class for the type of the given item with the given type property.
   */
  getItemTypeStyleClass: function(item, typeProperty) {
    return this.getTypeStyleClass(item[typeProperty]);
  },

  /**
   * Returns the style class for the given type.
   */
  getTypeStyleClass: function(type) {
    return 'entity-' + type + '-font';
  },

  /**
   * Returns the iron icon for the type of the given item with the given type property.
   */
  getItemTypeIronIcon: function(item, typeProperty) {
    return this.getTypeIronIcon(item[typeProperty]);
  },

  /**
   * Returns the iron icon for the given type.
   */
  getTypeIronIcon: function(type) {
    switch(type) {
      case 'date': return 'icons:date-range';
      case 'email': return 'communication:email';
      case 'location': return 'communication:location-on';
      case 'money': return 'editor:attach-money';
      case 'offer': return 'maps:local-offer';
      case 'phone': return 'communication:phone';
      case 'photo': return 'image:photo';
      case 'provider': return 'icons:account-circle';
      case 'seller': return 'group-work';
      case 'webpage': return 'av:web';
    }
  },

  /**
   * Returns the text for the type of the given item with the given type property (and returns long text if specified).
   */
  getItemTypeText: function(item, typeProperty, longText) {
    return this.getTypeText(item[typeProperty], longText);
  },

  /**
   * Returns the text for the given type (and returns long text if specified).
   */
  getTypeText: function(type, longText) {
    if(type === 'offer') {
      return 'ad';
    }
    if(type === 'seller') {
      return 'email/phone cluster';
    }
    if(longText && type === 'email') {
      return 'email address';
    }
    if(longText && type === 'phone') {
      return 'telephone number';
    }
    return type;
  }
};
