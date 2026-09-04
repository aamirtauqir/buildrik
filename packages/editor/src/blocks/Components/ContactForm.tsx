/**
 * Aquibra Contact Form Block
 * @license BSD-3-Clause
 */

export const contactFormBlockConfig = {
  id: "contact-form",
  label: "Contact Form",
  category: "Forms",
  elementType: "form" as const,
  icon: "📧",
  content:
    '<form class="buildrick-contact-form" data-buildrick-type="form">' +
    '<div class="buildrick-contact-field"><label>Name</label><input type="text" name="fullname" placeholder="Your name"/></div>' +
    '<div class="buildrick-contact-field"><label>Email</label><input type="email" name="email" placeholder="you@example.com"/></div>' +
    '<div class="buildrick-contact-field"><label>Message</label><textarea name="message" placeholder="How can we help?"></textarea></div>' +
    '<button type="submit" class="buildrick-contact-submit">Send Message</button>' +
    "</form>",
};

