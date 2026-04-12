# Georgia Trips – Admin Panel Guide 🎛️

## Overview

The admin panel allows you to manage featured tours that appear in the **"This Season's Best Deal"** section on the homepage. You can toggle individual tours on and off to feature them.

---

## How to Access the Admin Panel

### Method 1: Direct Link
Visit: `admin.html` directly in your browser

### Method 2: Via Navbar
1. Click the **Login** button in the top-right navbar
2. You'll see the **⚙️ Admin Panel** link in the dropdown menu
3. Click it to go to the admin panel

### Authentication
When you first access the admin panel, you'll be prompted for a password:
- **Default Password:** `admin123`
- *(Update this in admin.html line 330 for production use)*

---

## Managing Tours

### Admin Panel Layout

The admin panel is organized into two main sections:

#### 1. **🏔️ Domestic Tours**
- Tours in the "one-day" category
- Short excursions and day trips
- Examples: Mtskheta & Jvari, Kakheti Wine Day, Kazbegi Mountain Adventure

#### 2. **✈️ International Tours**
- Tours in the "multi-day" category  
- Multi-day packages and immersive experiences
- Examples: Best of Georgia 5 Days, Mountains & Black Sea 7 Days

### How to Feature a Tour

1. **Find the tour** in either the Domestic or International section
2. **Click the toggle switch** next to the tour
   - The switch will turn **green** and show a "Featured" badge
   - The tour is now featured and will appear in "This Season's Best Deal"

### How to Unfeature a Tour

1. **Find the featured tour** (will have a "Featured" badge)
2. **Click the toggle switch** to turn it off
   - The switch will turn **gray**
   - The tour will no longer appear in "This Season's Best Deal"

---

## What Happens When You Feature Tours?

✅ **Featured tours automatically appear** on the homepage in the "This Season's Best Deal" slider section  
✅ **The slider updates dynamically** – no page refresh needed  
✅ **Featured status is saved** to your browser's localStorage  
✅ **Works for both domestic and international tours**

### Example Workflow

1. You visit the admin panel and toggle 3 tours as "Featured":
   - Kazbegi Mountain Adventure (Domestic)
   - Best of Georgia — 5 Days (International)  
   - Wine & Culture — 4 Days (International)

2. Users visiting the homepage will see these 3 tours in the carousel at the top

3. They can:
   - Click through the carousel with arrow buttons
   - Click dots to jump to a specific tour
   - Click "Learn More" to go to the full tours page

---

## Important Notes

⚠️ **Data Storage:** Featured tour settings are saved in your browser's localStorage. If you clear your browser data, these settings will be lost.

⚠️ **Multiple Devices:** Featured tour settings are device-specific. You'll need to set them on each device/browser.

💡 **Best Practice:** Feature 2–5 tours for the best visual impact on the carousel.

---

## Troubleshooting

### The admin panel won't let me in
- Check that you're using the correct password: `admin123`
- Make sure you're accessing `admin.html` (not another file)

### Changes don't appear on the homepage
- Refresh the homepage to see the new featured tours
- Check that the toggle switch turned green (featured)

### How do I reset featured tours?
- Un-toggle all tours in the admin panel, OR
- Clear browser localStorage:
  1. Open browser DevTools (F12)
  2. Go to Application → Local Storage
  3. Find and delete `toursFeaturedStatus`

---

## For Developers

### Data Structure

Featured tours are stored in localStorage as:
```javascript
localStorage.setItem('toursFeaturedStatus', JSON.stringify({
  'od-1': true,    // Featured
  'md-2': true,    // Featured
  'od-3': false,   // Not featured
  // ... more tours
}))
```

### Adding New Tours

When you add new tours to `tours-data.js`, they automatically appear in the admin panel with:
- `isFeatured: false` (by default, not featured)
- A toggle switch to enable/disable
- Full tour details and pricing

### Rendering Featured Tours

The homepage loads featured tours in `script.js`:
```javascript
function renderFeaturedTours() {
  // Reads localStorage for featured status
  // Renders only featured tours in the "This Season's Best Deal" slider
}
```

---

## Contact & Support

For questions about the admin panel or to update the password:
- Email: georgiatrips5@gmail.com
- Phone: +995 504 22 00 20
