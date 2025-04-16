
  <TEST_SCENARIO_1>
    ## Objective: Authenticate User
    ## Test Group: Authentication
    ## Dependencies / Preconditions:
      - User account "10xadmin" must exist
      - Must be logged out
    ## Setup Steps (if needed beyond starting page):
      - None required beyond navigating to the initial page.
    ## Test Suite: authentication.noauth.spec.ts
    ## User Workflow Steps:
      1. Navigate to the login page: `http://localhost:3000/login`
      2. Enter username "10xadmin" into the username field
      3. Enter valid password into the password field ("10xpassword")
      4. Click the "Login" button
    ## Expected Outcomes / Assertions:
      - User is redirected to the main dashboard: `http://localhost:3000/home`
      - A "Welcome to 10xCMS" message is displayed
      - The "Logout" button is visible
    ## Dynamic Data Considerations:
      - None
    ## Potential Challenges:
      - None
  </TEST_SCENARIO_1>

  <TEST_SCENARIO_2>
    ## Objective: Create a New Collection
    ## Test Group: Collection Management
    ## Dependencies / Preconditions:
      - User must be logged in
    ## Setup Steps (if needed beyond starting page):
      - None required beyond navigating to the collections page.
    ## Test Suite: collections.auth.spec.ts
    ## User Workflow Steps:
      1. Navigate to the collections page: `http://localhost:3000/collections`
      2. Click the "Create New Collection" button
      3. Enter "Notes" in the "Collection Name" field
      4. Enter "Title" in the first "Field Name" field, keeping type as "Text (Short)"
      5. Click "Add Field"
      6. Enter "Description" in the second "Field Name" field, change type to "Text (Long)"
      7. Click "Add Field"
      8. Enter "Date" in the third "Field Name" field, change type to "Date"
      9. Click the "Create Collection" button
    ## Expected Outcomes / Assertions:
      - User is redirected to the collections page: `http://localhost:3000/collections`
      - A new collection named "Notes" is listed
      - A success notification "Collection created successfully!" is displayed
    ## Dynamic Data Considerations:
      - None
    ## Potential Challenges:
      - None
  </TEST_SCENARIO_2>

  <TEST_SCENARIO_3>
    ## Objective: Add a New Item to a Collection
    ## Test Group: Item Management
    ## Dependencies / Preconditions:
      - User must be logged in
      - Collection "Notes" must exist
    ## Setup Steps (if needed beyond starting page):
      - None required beyond navigating to the collection details page.
    ## Test Suite: collections.auth.spec.ts
    ## User Workflow Steps:
      1. Navigate to the collections page: `http://localhost:3000/collections`
      2. Click the "View Collection" button for the "Notes" collection
      3. Click the "Add New Item" button
      4. Enter "Movies" in the "Title" field
      5. Enter "- Terminator 2\n- Terminator 3" in the "Description" field
      6. Enter "01.01.2024" in the "Date" field
      7. Click the "Save Item" button
    ## Expected Outcomes / Assertions:
      - A new item is listed in the "Notes" collection
      - The new item has "Movies" in the "Title" column
      - The new item has "- Terminator 2 - Terminator 3" in the "Description" column
      - The new item has "2024-01-01" in the "Date" column
      - A success notification "Item added successfully!" is displayed
    ## Dynamic Data Considerations:
      - Collection ID in the URL will be dynamic and should be retrieved programmatically.
    ## Potential Challenges:
      - Date picker interaction might need specific handling.
  </TEST_SCENARIO_3>

  <TEST_SCENARIO_4>
    ## Objective: Delete an Item from a Collection
    ## Test Group: Item Management
    ## Dependencies / Preconditions:
      - User must be logged in
      - Collection "Notes" must exist
      - Item "Movies" must exist in "Notes" collection
    ## Setup Steps (if needed beyond starting page):
      - None required beyond navigating to the collection details page.
    ## Test Suite: collections.auth.spec.ts
    ## User Workflow Steps:
      1. Navigate to the collections page: `http://localhost:3000/collections`
      2. Click the "View Collection" button for the "Notes" collection
      3. Click the "Delete" button for the "Movies" item
      4. Click the "OK" button in the confirmation dialog
    ## Expected Outcomes / Assertions:
      - The "Movies" item is removed from the list
      - The "No items in this collection yet. Add your first item to get started." message is displayed
      - A success notification "Item deleted successfully!" is displayed
    ## Dynamic Data Considerations:
      - Collection ID in the URL will be dynamic and should be retrieved programmatically.
    ## Potential Challenges:
      - Handling the confirmation dialog.
  </TEST_SCENARIO_4>

  <TEST_SCENARIO_5>
    ## Objective: Open the Edit Item Modal
    ## Test Group: Item Management
    ## Dependencies / Preconditions:
      - User must be logged in
      - Collection "Notes" must exist
      - Item "Movies" must exist in "Notes" collection
    ## Setup Steps (if needed beyond starting page):
      - None required beyond navigating to the collection details page.
    ## Test Suite: collections.auth.spec.ts
    ## User Workflow Steps:
      1. Navigate to the collections page: `http://localhost:3000/collections`
      2. Click the "View Collection" button for the "Notes" collection
      3. Click the "Edit" button for the "Movies" item
    ## Expected Outcomes / Assertions:
      - The Edit Item Modal to open with the data populated from the edited item.
    ## Dynamic Data Considerations:
      - Collection ID in the URL will be dynamic and should be retrieved programmatically.
    ## Potential Challenges:
      - None.
  </TEST_SCENARIO_5>

  <TEST_PLAN_OVERVIEW>
    ## Suggested Page Objects:
      - LoginPage
      - DashboardPage
      - CollectionsPage
      - CollectionDetailsPage
      - NewCollectionModal
      - NewItemModal
      - EditItemModal

    ## Suggested Test Suites:
      - authentication.auth.spec.ts
      - collections.auth.spec.ts

    ## General Notes / Strategy:
      - Implement a login fixture/setup to avoid repeating login steps in each test.
      - Use unique names for created collections/items to avoid conflicts (e.g., "note-${Date.now()}")
      - Utilize API helpers for creating test data setup, like collections, if possible.
  </TEST_PLAN_OVERVIEW>

  <SELECTOR_REQUIREMENTS>
    ## Essential Elements for Stable Selectors:
    To facilitate reliable test automation, please ensure stable and unique identifiers (e.g., data-testid attributes) are added for the following key UI elements observed during the workflows:
    - Login button
    - Username input field
    - Password input field
    - Collections link in the navigation bar
    - Create New Collection button
    - Collection Name input field in the New Collection Modal
    - Add Field button in the New Collection Modal
    - Field Name input field in the New Collection Modal
    - Type dropdown in the New Collection Modal
    - Create Collection button in the New Collection Modal
    - View Collection button for each collection
    - Add New Item button
    - Title input field in the New Item Modal
    - Description input field in the New Item Modal
    - Date input field in the New Item Modal
    - Save Item button in the New Item Modal
    - Delete button for each item
    - Edit button for each item
    - OK button in the confirmation dialog
  </SELECTOR_REQUIREMENTS>
