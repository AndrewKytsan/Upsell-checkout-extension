import {
  useApi,
  reactExtension,
  useSettings,
  Heading,
  InlineLayout,
  BlockSpacer,
  Image,
  BlockLayout,
  Text,
  Button,
  useCartLines,
  useApplyCartLinesChange
} from '@shopify/ui-extensions-react/checkout';

import { useState, useEffect } from 'react';

export default reactExtension(
  'purchase.checkout.contact.render-after',
  () => <Extension />,
);


function Extension() {
  const { query } = useApi();
  const [variant, setVariant] = useState(null);
  const [addedToCart, setAddedToCart] = useState(false);
  const [loading, setLoading] = useState(false);

  const settings = useSettings();
  const variant_id = settings.product_variant;
  // const variant_id = 'gid://shopify/ProductVariant/48129191051448'
  // 
  useEffect(()=> {
    async function getVariantData() {
      const qeryResult = await query(`{
        node(id: "${variant_id}") {
          ... on ProductVariant {
            title
            price {
              amount
              currencyCode
            }
            image {
              url
            }
            product {
              title
              featuredImage {
                url
              }
            }
          }
        }
      }`)
      if (qeryResult.data) {
        setVariant(qeryResult.data.node)
      }
    }

    getVariantData()
  },[])

  const itemsInCart = useCartLines();
  const updateCart = useApplyCartLinesChange();
  function toggleCart () {
    setLoading(true);
    const variantInCart = itemsInCart.find(cartLine => cartLine.merchandise.id === variant_id)?.id
    if (variantInCart) {
      updateCart ({
        type: "removeCartLine", 
        quantity: 1,
        id: variantInCart
      }).then((data)=> {
        if (data.type === 'success') {
          setLoading(false)
          setAddedToCart(false);
        }
      })
    } else {
      updateCart ({
        type: "addCartLine", 
        quantity: 1,
        merchandiseId: variant_id
      }).then((data)=> {
        if (data.type === 'success') {
          setLoading(false)
          setAddedToCart(true);
        }
      })
    }
  }

  // useEffect(()=> {
  //   if (addedToCart) {
  //     setLoading(true)
  //     updateCart ({
  //       type: "addCartLine", 
  //       quantity: 1,
  //       merchandiseId: variant_id
  //     }).then((data)=> {
  //       if (data.type === 'success') {
  //         setLoading(false)
  //       }
  //     })
  //   } else {
  //     const variantInCart = itemsInCart.find(cartLine => cartLine.merchandise.id === variant_id)?.id
  //     if (variantInCart) {
  //       setLoading(true);
  //       updateCart ({
  //         type: "removeCartLine", 
  //         quantity: 1,
  //         id: variantInCart
  //       }).then((data)=> {
  //         if (data.type === 'success') {
  //           setLoading(false)
  //         }
  //       })
  //     }
  //   } 
  // }, [addedToCart])

  if(!variant) return null;

  return (
  <>
  <BlockSpacer spacing="base"></BlockSpacer>
  <Heading level={2}>
    Yo may also like
  </Heading>
  <BlockSpacer spacing="base"></BlockSpacer>
  <InlineLayout blockAlignment="center" spacing={['base', 'base']} columns={[120, 'fill']} padding="base">
    <Image source={variant?.product?.featuredImage.url} border="base" borderRadius="base" borderWidth="base" />
    <BlockLayout rows={['fill', 'auto']}>
      <BlockLayout rows={['fill', 'fill']}>
        <Text size="medium">{variant.title}</Text>
        <Text size="small">{variant.price.amount}{variant.price.currencyCode}</Text>
      </BlockLayout>
      <Button onPress={()=> toggleCart()} loading={loading}>
        {addedToCart ? 'Remove': 'Add to Cart'}
      </Button>
    </BlockLayout>
  </InlineLayout>
  </>
  );
}