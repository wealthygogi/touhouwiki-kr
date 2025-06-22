import type { ReactNode } from "react";
import clsx from "clsx";
import Heading from "@theme/Heading";
import styles from "./styles.module.css";

type FeatureItem = {
  title: string;
  Svg: React.ComponentType<React.ComponentProps<"svg">>;
  description: ReactNode;
};

const FeatureList: FeatureItem[] = [
  {
    title: "글 출처",
    Svg: () => (
      <img
        src={require("@site/static/img/AbstractCactus_Logo_03.png").default}
        alt="Abstract Cactus Logo"
        style={{ maxWidth: "100px" }}
      />
    ),
    description: (
      <a
        href="https://www.thpatch.net/"
        target="_blank"
        rel="noopener noreferrer"
      >
        https://www.thpatch.net/
      </a>
    ),
  },
  {
    title: "그림 출처",
    Svg: () => (
      <img
        src={require("@site/static/img/image.png").default}
        alt="Docusaurus Tree"
        style={{ maxWidth: "100px" }}
      />
    ),
    description: (
      <a
        href="https://x.com/dairi155"
        target="_blank"
        rel="noopener noreferrer"
      >
        https://x.com/dairi155
      </a>
    ),
  },
  {
    title: "License",
    Svg: () => (
      <img
        src={require("@site/static/img/cc-by-sa.png").default}
        alt="CC BY-SA 4.0"
        style={{ maxWidth: "100px", marginBottom: "0.5rem" }}
      />
    ),
    description: (
      <a
        href="https://creativecommons.org/licenses/by/4.0/deed.en"
        target="_blank"
        rel="noopener noreferrer"
      >
        CC BY-SA 4.0
      </a>
    ),
  },
];

function Feature({ title, Svg, description }: FeatureItem) {
  return (
    <div className={clsx("col col--4")}>
      <div className="text--center">
        <Svg className={styles.featureSvg} role="img" />
      </div>
      <div className="text--center padding-horiz--md">
        <Heading as="h3">{title}</Heading>
        <p>{description}</p>
      </div>
    </div>
  );
}

export default function HomepageFeatures(): ReactNode {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}
