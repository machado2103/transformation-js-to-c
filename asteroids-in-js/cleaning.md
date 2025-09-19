### Code Deep Cleaning Protocol - Full Context Analysis
### IMPORTANT: THIS .md FILE IS SHOULD ONLY BE IMPLEMENTED WHEN THE USER STATES YOU TO DO SO

## Primary Objective
Perform a comprehensive deep cleaning of the existing codebase to make it more compact and lightweight while preserving 100% of existing functionality.

## Critical Rules
- **NEVER** remove functionality: only optimize its implementation
- **Test preservation**: Every feature that works before cleaning must work after
- **Incremental changes**: Make one type of change at a time
- **Full context awareness**: Analyze entire codebase before making cross-file changes
- **Loop**: DO NOT STOP UNTIL EVERYTHING IS FINISHED

## Pre-Cleaning Setup [MANDATORY FIRST STEP]

### Create Logging Structure
Before starting any analysis or cleaning, create the following structure:

```
cleaning.logs/
├── cleaning-summary.log
└── dependencies-analysis.log
```

**File 1: cleaning-summary.log**
Document every cleaning action in real-time:
- Phase being executed
- Files modified
- Specific changes made
- Count of removals/consolidations
- Timestamp of each action (the timestamp MUST be the real time and not a random time)

**File 2: dependencies-analysis.log**
Complete structured dependency map from Phase 1 analysis:
- Full file hierarchy
- Function call chains
- Module dependencies graph
- Cross-file relationships
- Critical path mappings

## Phase 1: Complete Codebase Analysis [DO NOT SKIP]

### Step 1.1: Initial Inventory
Before making ANY changes, create a complete inventory:

1. List all files in the project with their purposes
2. Document all classes/modules and their responsibilities
3. Map all function dependencies (what calls what)
4. Identify all external APIs/libraries used
5. Note all event listeners and handlers
6. Document all state management patterns
7. List all user-facing features

Output format:
- **FILE**: [filename]
  - **PURPOSE**: [main responsibility]
  - **DEPENDENCIES**: [files it depends on]
  - **DEPENDENTS**: [files that depend on it]
  - **KEY FUNCTIONS**: [critical functions that must not break]


### Step 1.2: Functionality Map

Create a comprehensive feature map:

For each user-facing feature:
- **Feature name**
- **Entry point** (where it starts)
- **Files involved**
- **Functions/methods used**
- **Data flow**
- **UI elements affected**

This map is your safety net - refer to it before every change.

### Step 1.3: Dependency Graph

Build a dependency graph showing:
- **Which files** import/require others
- **Which functions** call other functions
- **Shared utilities** and where they're used
- **Global variables** and their consumers
- **Event emitters and listeners** relationships


## Phase 2: Debug and Log Cleanup [SAFE OPERATIONS]
### Step 2.1: Console Statement Removal
Target patterns to remove:
- `console.log()`
- `console.debug()`
- `console.info()`
- `console.trace()`
- `console.time()` / `console.timeEnd()`
- Debug-only comments like `// DEBUG:` or `// TODO: remove`

**EXCEPTIONS - DO NOT REMOVE:**
- `console.error()` in catch blocks (keep for production errors)
- `console.warn()` for deprecation warnings
- Logs that are part of the actual functionality
- Logs shown to users as features

Process:
1. Search for each console method
2. Verify it's not part of functionality
3. Remove if purely for debugging
4. Keep a count of removals per file

### Step 2.2: Development-Only Code
Remove:
- Test data generators used only in development
- Mock API responses
- Development-only routes/endpoints
- Commented-out code blocks
- Alternative implementations that are commented

**VALIDATE:** After each file, ensure no production code was affected

## Phase 3: Duplicate Detection and Consolidation [CAREFUL OPERATIONS]
### Step 3.1: Exact Duplicate Functions

Process:
1. Find functions with identical implementations
2. Check if they have different names but same body
3. Verify they're used in the same way
4. Create a single version in appropriate location
5. Update all references to use the single version
6. Test that all call sites still work

Documentation required:
- Original function names and locations
- New consolidated function name and location
- List of all files updated

### Step 3.2: Similar Function Consolidation
For functions that are 80%+ similar:

1. Identify the differences
2. Determine if differences can be parameterized
3. Create unified function with parameters for variations
4. Example transformation:
   
   BEFORE:
   function saveUserData(data) { /* saves to users table */ }
   function saveAdminData(data) { /* saves to admins table */ }
   
   AFTER:
   function saveData(data, userType = 'user') {
     const table = userType === 'admin' ? 'admins' : 'users';
     // unified implementation
   }

5. Update all callers with appropriate parameters
6. Verify each use case still works correctly

### Step 3.3: Repeated Code Blocks

Identify and extract:
- Validation logic that appears multiple times
- Error handling patterns
- Data transformation sequences
- API call patterns
- UI update sequences

Create utility functions or shared modules for these patterns.

## Phase 4: Architecture Optimization [COMPLEX OPERATIONS]

### Step 4.1: Module Consolidation
Only if modules have significant overlap:

1. Identify modules with similar purposes
2. Check if they can be merged without creating mega-modules
3. Ensure merged module has single responsibility
4. Update all imports/requires
5. Maintain clear internal organization

**Rule:** A module should not exceed 300 lines after consolidation

### Step 4.2: Utility Organization
1. Collect all utility functions
2. Group by functionality (string utils, date utils, etc.)
3. Create focused utility modules
4. Remove utilities that are used only once (inline them)
5. Ensure no circular dependencies

### Step 4.3: Event Handler Optimization
1. Find duplicate event listeners
2. Consolidate similar handlers
3. Use event delegation where appropriate
4. Remove unused event listeners
5. Ensure no memory leaks from listeners

## Phase 5: Code Compaction [FINAL OPERATIONS]

### Step 5.1: Import Optimization

1. Remove unused imports
2. Consolidate imports from same module
3. Use destructuring where appropriate
4. Order imports consistently

### Step 5.2: Variable and Function Optimization

1. Remove unused variables
2. Inline single-use variables (if it improves readability)
3. Use optional chaining (?.) where appropriate
4. Use nullish coalescing (??) where appropriate
5. Simplify conditional expressions

### Step 5.3: Comment Cleanup

Remove:
- Obvious comments that repeat the code
- Outdated comments
- Commented-out code

Keep:
- Complex algorithm explanations
- API documentation
- Warning comments about non-obvious behavior
- License headers

## Phase 5B: Test and Development Code Removal

### Step 5B.1: Identify Obsolete Tests
Remove test files and directories that:

- Test functionality that no longer exists
- Are for development/debugging only
- Mock data generators not used in production
- Unit tests for removed/consolidated functions
- Integration tests for deprecated features

Keep:

- Tests for core functionality
- Tests that validate critical paths
- Tests required for deployment/CI/CD

### Step 5B.2: Remove Test Infrastructure
Target for removal:

- Test configuration files not needed for production
- Test runners and their configs (if not needed)
- Coverage report generators
- Test fixture files
- Development-only dependencies in package.json

## Phase 6: Validation and Testing [MANDATORY]

### Step 6.1: Functionality Checklist
Go through your Phase 1 functionality map:
[ ] Each feature still accessible
[ ] Each feature produces same output
[ ] No new errors in console
[ ] Performance not degraded
[ ] All user interactions work

### Step 6.2: Regression Check

1. Test every major user flow
2. Verify API integrations still work
3. Check data persistence
4. Validate UI responsiveness
5. Test edge cases

### Step 6.3: Size and Performance Metrics
Document improvements:
- Lines of code: before vs after
- File sizes: before vs after
- Number of files: before vs after
- Load time improvements
- Memory usage changes

## Phase 7: Final Deep Clean [USER-TRIGGERED]

**Activation:** Only execute when user explicitly writes "do the final cleaning"

### Step 7.1: Framework-Specific Cleanup

Remove development framework artifacts:

- Claude-specific development helpers
- Spec-kit testing utilities
- Development middleware
- Debug panels and overlays
- Development-only routes
- Framework boilerplate not used
- Example/demo components
- Unused framework features


### Step 7.2: Build Tool Cleanup

Remove unnecessary build configurations:

- Development webpack configs
- Unused babel presets
- Development-only plugins
- Source map generation (if not needed)
- Hot reload configurations
- Development server configs

### Step 7.3: Dependency Purge
Final dependency audit:

- List all dependencies in package.json
- Trace actual usage in production code
- Remove unused dependencies
- Remove development dependencies not needed for build
- Update package.json
- Document removed packages in cleaning-summary.log

### Step 7.4: Final Validation

After final deep clean:

- Verify production build still works
- Test all critical user paths
- Ensure no runtime errors
- Check that deployment process works
- Document final size reduction metrics

### Final Logging

Update cleaning.logs/cleaning-summary.log with:

- Total lines removed
- Total files deleted
- Dependencies removed
- Final bundle size
- Percentage reduction achieved


## Cleaning Checklist Template

For each file being cleaned:

### File: [filename]

#### Pre-cleaning Analysis
- [ ] Dependencies mapped
- [ ] Functions catalogued
- [ ] Features using this file identified

#### Cleaning Actions
- [ ] Console statements removed: [count]
- [ ] Debug code removed: [count]
- [ ] Duplicate functions consolidated: [list]
- [ ] Similar functions merged: [list]
- [ ] Unused code removed: [description]
- [ ] Comments cleaned: [count]

#### Validation
- [ ] All features still work
- [ ] No new errors
- [ ] Dependencies intact
- [ ] File size reduced by: [percentage]

#### Notes
[Any special considerations or warnings]

## Emergency Rollback Plan
If something breaks:

Identify which phase caused the issue
Review the specific changes in that phase
Check the dependency graph for missed connections
Restore the specific functionality from backup
Document why the optimization failed
Try alternative approach or skip that optimization
