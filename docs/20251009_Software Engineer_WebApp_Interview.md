**Take-Home Assignment — Senior Software Engineer (Full Stack : web application)**

**Goal**

Build a simple Meeting Manager web application where users can create, update, delete, and list meetings.

**Requirements**

**Core Features**

* A user can add a new meeting (title, description, due date, status).  
* A user can view a list of meetings (with pagination or infinite scroll).  
* A user can edit a meeting (change title, description, due date, status).  
* A user can delete a meeting.  
* Meetings should persist (in memory, JSON file, SQLite, or DB — your choice).

**Technical Requirements**

* Frontend: Use React or Vue. Styling is up to you.   
* Backend: Use Node.js with Express or Python with FastAPI/Flask.  
* Provide a simple REST API for CRUD operations.(DB can mockup)  
* Include a **README** with setup instructions.  
* Containerized the web for deployment (Including Frontend, Backend, and Database).  
* Deploy the app (e.g., on Vercel/Render/Heroku/Docker).

**Bonus (Optional)**

* Add user authentication (login/logout).  
* UI Design (e.g., Figma, Adobe XD, Sketch, Penpot) is a plus.  
* Add tests (unit or integration).  
* CI/CD flow for testing and deployment. (e.g., GitHub Action) 

**Deliverables**

* GitHub repo with code, clear commit history, and README.  
* GitHub should be publicly accessible.  
* Instructions to run locally.

**Time Expectation**

* Spent about 1 week.It doesn’t need to be perfect, just demonstrate how you approach structuring and building software.

**App Flow (Wireframe Pages)**

**1\. Login / Logout (optional)**

* **Login screen:**  
  * Company logo \+ title *“Candidate Meeting Scheduler”*  
  * Email \+ password inputs  
  * “Login” button  
  * \[Optional: “Continue as Guest”\]

---

**2\. Dashboard – Current Meetups**

* Header: *“Upcoming Meetings”*  
* Card list of current meetings:  
  * Candidate name \+ role applied (e.g., *“Alice – Software Engineer”*)  
  * Date \+ time (e.g., *“Oct 12, 2025 · 10:00 AM – 11:00 AM”*)  
  * Status: Confirmed / Pending  
  * Button: *“View Details”*

---

**3\. Booking Form**

* Header: *“Schedule a New Meeting”*  
* Fields:  
  * Candidate Name (autocomplete or free text)  
  * Position (dropdown: *Software Engineer, Backend, Frontend…*)  
  * Date picker  
  * Time picker (start & end)  
  * Meeting type (Onsite / Online \[Zoom, Google Meet\])  
  * Notes (text area)  
* **Submit button:** *“Book Meeting”*

---

**4\. Candidate Summary Page**

* Header: Candidate profile (name \+ applied role)  
* Sections:  
  * **Meeting Info**: Upcoming meeting(s) date, time, status  
  * **Interview Notes**: Text area for recruiter/engineer notes  
  * **History**: Previous interviews / evaluations  
* Buttons:  
  * “Edit Meeting”  
  * “Cancel Meeting”  
  * “Add Feedback”

