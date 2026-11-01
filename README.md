# What Keeps You Steady?
 
**A Protective Factors Self-Check for High School Psychology**
 
Developed by **Eric E Castro**, Psychology Department, St Ignatius College Prep
 
---
 
## 1. About the instrument
 
"What Keeps You Steady?" is a short, anonymous, web-based self-assessment for students (designed for 18-year-olds) in an introductory psychology course. It opens the **Therapies unit**, where the class discusses protective factors and risk factors in mental health.
 
Protective factors are the relationships, habits, and ways of thinking that support mental health and help people recover from setbacks. Risk factors are the conditions that make difficulties more likely. Starting the unit with a private look at their own protective factors gives students a personal anchor for the discussion that follows: what the research says, which factors can and cannot be changed, and how therapies often work by strengthening protective factors and reducing risk factors.
 
The instrument has two parts and takes about 7 minutes.
 
### Part 1: Rate your protective factors
 
Students rate 15 statements from 1 ("Not true for me") to 5 ("Very true for me") across six factors:
 
- Social support
- Coping skills
- Physical health
- Sense of purpose
- Self-esteem
- Healthy thinking
As students answer, a six-sided chart fills in with their average for each factor. When they finish, the page names their strongest factor and their two areas with the most room to grow, with a few small, practical ideas for each.
 
### Part 2: How you compare
 
Four questions match items from large national surveys, so students can compare themselves with people their age:
 
| Question | Comparison source |
|---|---|
| Feeling close to people at school | CDC Youth Risk Behavior Survey |
| Days physically active for 60+ minutes | CDC Youth Risk Behavior Survey |
| Hours of sleep on a school night | CDC Youth Risk Behavior Survey |
| Feeling lonely for a lot of the previous day | Gallup |
 
### Class averages
 
Once a student finishes Part 1, their six factor averages and any Part 2 answers are saved anonymously to a Google Sheet, with the date only. The page then shows the class average beside each student's own results. Class averages stay hidden until at least 5 students have taken part, so no individual can be identified. Over the years, the Sheet's **Trends** tab builds a record of class averages by school year.
 
### What the instrument is not
 
It is a reflection and teaching tool. It is not a clinical screener, a diagnostic test, or a validated psychometric scale. The Part 1 items were adapted for classroom use and have no published norms; only the Part 2 questions have national comparison figures.
 
### Privacy
 
The page never asks for a name or email. The only data saved are:
 
- the six factor averages
- the four Part 2 answers
- the date
- an optional section code
- a random ID that exists only for that browser tab (it lets a student's later changes update their own row instead of adding a new one)
No time of day, IP address, or device details are saved. Downloads and printouts stay on the student's device.
 
At St Ignatius, students assented and parents consented to this anonymous data collection before the instrument was used. The privacy note on the page says so.
 
---
 
## 2. What's in this repository
 
| File | Purpose |
|---|---|
| `index.html` | The complete web page (HTML, CSS, and JavaScript in one file). This is what GitHub Pages serves to students. |
| `Code.gs` | The Google Apps Script that saves responses to a Google Sheet and sends class averages back to the page. |
| `README.md` | This file. |
 
---
 
## 3. Adopting the instrument at your school
 
You need a free GitHub account and a Google account. No server or programming background is required, though comfort editing a text file helps. Plan on about 30 minutes.
 
### Before you start
 
- **Get approval.** Even anonymous wellbeing data, especially the loneliness question, is something your administration and counseling office should know about. Follow your school's consent and data-retention policies.
- **Check your Google Workspace settings.** Some school accounts block web apps from being available to "Anyone." If yours does, ask your IT department or deploy from a personal Google account.
### Step 1: Publish the page on GitHub Pages
 
1. Create a new public repository on GitHub, for example `protective-factors`.
2. Upload `index.html` (and this `README.md`) to the repository's root.
3. Go to **Settings > Pages**. Under "Build and deployment," choose **Deploy from a branch**, select `main` and `/ (root)`, and save.
4. After a minute or two, the page is live at `https://YOUR-USERNAME.github.io/protective-factors/`
> If you don't want class averages, stop here. With no Sheet address set, the page saves nothing and works as a private self-check.
 
### Step 2: Set up the Google Sheet
 
1. Create a new, empty Google Sheet.
2. Open **Extensions > Apps Script**. Delete the starter code, paste in everything from `Code.gs`, and save.
3. In the function menu, choose `setup` and click **Run**. Approve the permissions Google asks for. This creates two tabs:
   - **Responses:** one row per student
   - **Trends:** averages by school year, with a line chart
4. Click **Deploy > New deployment** and choose type **Web app**:
   - Execute as: **Me**
   - Who has access: **Anyone**
   Click **Deploy** and copy the web app URL (it ends in `/exec`).
5. Check it: open the URL in a browser. You should see a short line of data beginning `{"ok":true,...`. If you see a sign-in page instead, the access setting is not "Anyone."
### Step 3: Connect the page to the Sheet
 
1. Open `index.html` in a text editor (or edit it on GitHub).
2. Near the top of the `<script>` section, find:
```js
   var SHEET_URL = "...";
```
 
   Replace the address between the quotes with your own web app URL.
 
   > **Important:** if you copied this repository, the URL in the file belongs to the original developer's Sheet. Replace it before any student uses your copy.
 
3. Save and upload the file to GitHub.
4. Test it: complete Part 1 yourself. Within a few seconds a new row should appear in the Responses tab. Delete your test row afterward.
### Step 4 (optional): Track class sections
 
Give each section its own link by adding `?section=` to the address:
 
```
https://YOUR-USERNAME.github.io/protective-factors/?section=P3
```
 
The section code is saved with each response, so you can filter the Responses tab by section. Class averages on the page combine all sections for the current school year.
 
### Updating the script later
 
After any change to `Code.gs`, publish it again with **Deploy > Manage deployments > Edit** (pencil icon) **> Version: New version > Deploy**. The web app URL stays the same.
 
---
 
## 4. Changing the instrument for your school
 
Everything below is in `index.html` unless noted. Search the file for the names shown in `code`.
 
### Easy changes (safe to make freely)
 
- **Statement wording.** In the `FACTORS` list, edit the text in each factor's `items`. Keep three or fewer statements per factor if you want the page length to stay about the same.
- **Factor descriptions and improvement ideas.** Edit `blurb` and `ideas` in the `FACTORS` list.
- **Introduction, privacy note, and footer text.** These are ordinary HTML near the top and bottom of the file. Rewrite the privacy note so it accurately describes *your* consent process; do not keep the St Ignatius wording unless it is true for your students.
- **Crisis and support resources.** The footer lists the US 988 Suicide & Crisis Lifeline. Replace it with your school counseling contact and the right crisis line for your country.
- **National comparison figures.** In the `PEERS` list, each question has `pct` (the percentage), `who`, `groupLabel`, the two messages, and `source`/`url`. When the CDC releases a newer Youth Risk Behavior Survey, update these numbers and sources. If you're outside the US, swap in figures from your own national surveys, but only for questions asked the same way.
- **Minimum group size.** `MIN_CLASS_N` in `index.html` and `MIN_N` in `Code.gs` control how many students must take part before class averages appear. Keep the two numbers the same. 5 is a sensible minimum; raise it for large classes.
- **School year start.** `YEAR_STARTS_MONTH` in `Code.gs` sets the month a new school year begins (`8` = August). Change it if your year starts in a different month.
- **Colors and fonts.** Colors are set once at the top of the `<style>` section (light and dark versions). Fonts load from Google Fonts; delete the three font `<link>` lines if you want the page to make no outside requests other than to your own Sheet.
### Changes that need care
 
- **Adding or removing factors.** The chart is drawn as a hexagon and assumes exactly six factors, and `Code.gs` stores exactly six factor columns. To change the number of factors, you would need to edit the chart code, the `Code.gs` column lists (`FACTOR_IDS` and `HEADERS`), and the Trends formula together. Renaming a factor is easy; changing how many there are is not.
- **Adding or removing Part 2 questions.** Each question is linked to a column in the Sheet (see `PEER_KEY` and `buildPayload` in `index.html` and the peer columns in `Code.gs`). Changing the wording or national figure is easy; adding or removing a question means editing both files.
- **Saving behavior.** As written, responses save automatically once a student finishes Part 1. If your school requires students to opt in each time, you'll need a share button instead of automatic saving, and the privacy note must say so.
### Copyright reminder
 
Part 1 is adapted from the ideas in Therapist Aid's "Protective Factors" worksheet. The worksheet itself is copyrighted, so the statements on this page were rewritten in original wording. If you revise them, write your own wording rather than copying the original worksheet.
 
---
 
## 5. Using the data
 
- The **Responses** tab holds one row per student: date, school year, section, six factor averages (1 to 5), and the Part 2 answers.
- The **Trends** tab averages every column by school year and charts the six factors over time. Years with fewer than 5 students are too small to read much into.
- Class averages describe the group, not any student. Treat changes from year to year as prompts for discussion, not as evidence about a particular cohort; small classes and who chooses to take the self-check both affect the numbers.
- **Do not try to match rows to students.** The instrument was built so that this isn't possible, and students were told it wouldn't be.
### Sharing and reuse
 
Educators are welcome to adopt and adapt this instrument for their own classrooms. Please keep the developer credit and the acknowledgements below, and note your own changes.
 
---
 
## 6. Acknowledgements
 
### Concept and adaptation
 
Part 1 is adapted from the "Protective Factors" worksheet by Therapist Aid LLC (2017), [TherapistAid.com](https://www.therapistaid.com). The six factors and the general structure follow that worksheet; all statement wording on this page is original.
 
### National comparison data
 
- **Centers for Disease Control and Prevention (CDC).** Youth Risk Behavior Survey, 2023: school connectedness, physical activity, and sleep among US high school students.
  - [YRBS Data Summary & Trends Report](https://www.cdc.gov/yrbs/dstr/index.html)
  - [Dietary, Physical Activity, and Sleep Behaviors](https://www.cdc.gov/yrbs/dstr/dietary-physical-sleep-behaviors.html)
- **Gallup.** National Health and Well-Being Index, 2025: daily loneliness among US adults ages 18 to 29.
### Tools and typefaces
 
- GitHub Pages hosts the page.
- Google Sheets and Google Apps Script store responses and compute class averages.
- Atkinson Hyperlegible, a typeface designed by the Braille Institute for readability, and Bricolage Grotesque, both via Google Fonts.
### Development assistance
 
The page and script were built with the help of Claude, an AI assistant made by Anthropic, under the direction of the developer.
 
### Students and families
 
Thanks to the St Ignatius College Prep psychology students who take part, and to their families, whose consent makes the class averages possible.
 
---
 
*This instrument is for education and self-reflection only. It is not a clinical or diagnostic tool. Students who are struggling should be connected with a school counselor or other qualified professional.*
