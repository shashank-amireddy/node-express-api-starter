export const formatValidationErrors = (errors) => {
  if (!errors || !errors.issues) return 'No validation errors';

  if(Array.isArray(errors.issues)) return errors.issues.map(issue => `${issue.path.join('.')} - ${issue.message}`).join('; ');

  return JSON.stringify(errors);
};