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
  useApplyCartLinesChange,
  Select,
  useApplyDiscountCodeChange
} from '@shopify/ui-extensions-react/checkout';

import { useState, useEffect } from 'react';

export default reactExtension(
  'purchase.checkout.contact.render-after',
  () => <Extension />,
);


function Extension() {
  const { query } = useApi();
  const [product, setProduct] = useState(null);
  const [variant, setVariant] = useState(null);
  const [addedToCart, setAddedToCart] = useState(false);
  const [loading, setLoading] = useState(false);

  const settings = useSettings();
  let productId = '';
  let discountCode = '';

  if (settings.product_id_and_discount_code) {
    productId = `gid://shopify/Product/${settings.product_id_and_discount_code.split('|')[0]}`;
    discountCode = settings.product_id_and_discount_code.split('|')[1];
  }

  // 
  useEffect(()=> {
    async function getVariantData() {
      const productQuery = await query(`{
        node(id: "${productId}") {
          ... on Product {
            title
            handle
            id
            featuredImage {
              url
            }
            variants(first: 100) {
              edges {
                node {
                  title
                  id
                  price {
                    amount
                    currencyCode
                  }
                  image {
                    url
                  }
                  product {
                    featuredImage {
                      url
                    }
                  }
                }
              }
            }
          }
        }
      }`)

      if(productQuery.data) {
        setProduct(productQuery.data.node)
        setVariant(productQuery.data.node.variants?.edges[0]?.node)
      } 
    }
    getVariantData()
  },[])

  const itemsInCart = useCartLines();
  const updateCart = useApplyCartLinesChange();
  const applyCode = useApplyDiscountCodeChange();
  function toggleCart () {
    let discountCode = 'SAVE5';
    if (settings.product_id_and_discount_code) {
      productId = `gid://shopify/Product/${settings.product_id_and_discount_code.split('|')[0]}`;
      discountCode = settings.product_id_and_discount_code.split('|')[1];
    }
    setLoading(true);
    const variantInCart = itemsInCart.find(cartLine => cartLine.merchandise.id === variant?.id)?.id
    if (variantInCart) {
      updateCart ({
        type: "removeCartLine", 
        quantity: 1,
        id: variantInCart
      }).then((data)=> {
        if (data.type === 'success') {
          setLoading(false)
          setAddedToCart(false);
          if(discountCode) {
            applyCode({
              type: 'removeDiscountCode',
              code: `${discountCode}`
            })
          }
        }
      })
    } else {
      updateCart ({
        type: "addCartLine", 
        quantity: 1,
        merchandiseId: variant?.id
      }).then((data)=> {
        if (data.type === 'success') {
          setLoading(false)
          setAddedToCart(true);
          if(discountCode) {
            applyCode({
              type: 'addDiscountCode',
              code: `${discountCode}`
            })
          }
        }
      })
    }
  }

  function setCurrentVariant(value) {
    const currentVariant = product.variants?.edges.filter((item)=> item.node.id === value);
    setVariant(currentVariant[0].node)
  }

  // if(!variant) return null;
if(!variant) return null
  return (
  <>
  <BlockSpacer spacing="base"></BlockSpacer>
  <Heading level={2}>
    Yo may also like
  </Heading>
  <BlockSpacer spacing="base"></BlockSpacer>
  <InlineLayout blockAlignment="center" spacing={['base', 'base']} columns={[120, 'fill']} padding="base">
    <Image source={variant?.image?.url || variant?.product?.featuredImage.url} border="base" borderRadius="base" borderWidth="base" />
    <BlockLayout rows={['fill', 'auto']}>
      <BlockLayout rows={['fill', 'fill']}>
        <Text size="medium">{variant.title}</Text>
        <Text size="small">{variant.price.amount}{variant.price.currencyCode}</Text>
      </BlockLayout>
      <InlineLayout blockAlignment="center" spacing={['base', 'base']} columns={['fill', 'auto']}>
        <Select label="Select variant" value={variant?.id} options={product.variants?.edges.map((item)=> {
          return {
            value: `${item.node.id}`,
            label: `${item.node.title}`
          }
        })} onChange={(value)=>setCurrentVariant(value)}></Select>
      <Button onPress={()=> toggleCart()} loading={loading}>
        {addedToCart ? 'Remove': 'Add to Cart'}
      </Button>
      </InlineLayout>
    </BlockLayout>
  </InlineLayout>
  </>
  );
}