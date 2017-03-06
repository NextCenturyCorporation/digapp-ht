/*
 * Copyright 2017 Next Century Corporation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/* globals DigBehaviors */
/* exported DigBehaviors */
var DigBehaviors = DigBehaviors || {};

/**
 * Polymer behavior for telephone numbers.
 */
DigBehaviors.PhoneBehavior = {
  /**
   * Returns a string of unformatted phones separated by newlines.
   */
  getUnformattedPhones: function(phone) {
    // Replace all delimiters (whitespace, commas, and, semicolons) with single spaces.
    return phone.replace(/[\s,;]/g, ' ')
      // Remove all non-digit, non-whitespace characters.
      .replace(/[^\d\s]/g, '')
      // Remove extra spaces.
      .replace(/\s+/g, '\n')
      .trim();
  }
};
