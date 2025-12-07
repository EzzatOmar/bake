
export type TRuleResult = {
    message?: string; // message to send to ai
    error?: string; // error message to send to ai
    bash?: string; // bash to run
  }
  

export type TRuleFn = (args: {
    directory: string,
    filePath: string,
    content: string
}) => Promise<TRuleResult | undefined>