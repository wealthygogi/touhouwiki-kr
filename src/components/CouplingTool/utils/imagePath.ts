export const getImagePath = (gameId: string, imageName: string): string => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const imageModule = require(`@site/static/img/${gameId}/${imageName}`);
    return imageModule.default as string;
  } catch (error) {
    return `/img/${gameId}/${imageName}`;
  }
};
