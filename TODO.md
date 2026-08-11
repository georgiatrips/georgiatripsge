# Unified Page Hero Redesign — Task Checklist

## Objective
Replace the 5 inconsistent page headers (ტურები, ადგილები, სასტუმროები, ტრანსპორტი, სტატიები) with one shared, premium, minimal dark-image hero component.

## Steps
- [ ] Create `app/components/PageHeader.js` — shared hero component (kicker, title, subtitle, image, children, parallax/fade)
- [ ] Add `.page-header` unified CSS block in `app/globals.css`
- [ ] Update `app/tours/page.js` to use `<PageHeader>`
- [ ] Update `app/places/page.js` to use `<PageHeader>`
- [ ] Update `app/hotels/page.js` to use `<PageHeader>` (keep search inside children)
- [ ] Update `app/transfers/page.js` to use `<PageHeader>`
- [ ] Update `app/posts/page.js` to use `<PageHeader>`
- [ ] Verify build compiles and each page renders the unified hero
