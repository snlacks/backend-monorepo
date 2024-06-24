export const checkEnv = (name: string) => {
  if (!process.env[name]) {
    throw new Error(`${name} is a required Environmental Variable`);
  }
};
