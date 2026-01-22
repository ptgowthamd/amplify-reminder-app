/***************************************************************************
 * The contents of this file were generated with Amplify Studio.           *
 * Please refrain from making any modifications to this file.              *
 * Any changes to this file will be overwritten when running amplify pull. *
 **************************************************************************/

/* eslint-disable */
import * as React from "react";
import { Reminder } from "../models";
import { getOverrideProps, useDataStoreBinding } from "./utils";
import SocialPost from "./SocialPost";
import { Collection } from "@aws-amplify/ui-react";
export default function SocialPostCollection(props) {
  const { items: itemsProp, overrideItems, overrides, ...rest } = props;
  const [items, setItems] = React.useState(undefined);
  const itemsDataStore = useDataStoreBinding({
    type: "collection",
    model: Reminder,
  }).items;
  React.useEffect(() => {
    if (itemsProp !== undefined) {
      setItems(itemsProp);
      return;
    }
    setItems(itemsDataStore);
  }, [itemsProp, itemsDataStore]);
  return (
    <Collection
      type="list"
      isPaginated={true}
      searchPlaceholder="Search..."
      direction="column"
      justifyContent="left"
      items={items || []}
      {...getOverrideProps(overrides, "SocialPostCollection")}
      {...rest}
    >
      {(item, index) => (
        <SocialPost
          reminder={item}
          key={item.id}
          {...(overrideItems && overrideItems({ item, index }))}
        ></SocialPost>
      )}
    </Collection>
  );
}
