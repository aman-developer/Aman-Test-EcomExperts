if (!customElements.get('product-form')) {
  customElements.define(
    'product-form',
    class ProductForm extends HTMLElement {
      constructor() {
        super();

        this.form = this.querySelector('form');
        this.form.querySelector('[name=id]').disabled = false;
        this.form.addEventListener('submit', this.onSubmitHandler.bind(this));
        this.cart = document.querySelector('cart-notification') || document.querySelector('cart-drawer');
        this.submitButton = this.querySelector('[type="submit"]');

        if (document.querySelector('cart-drawer')) this.submitButton.setAttribute('aria-haspopup', 'dialog');

        this.hideErrors = this.dataset.hideErrors === 'true';
      }

      onSubmitHandler(evt) {
        evt.preventDefault();
        if (this.submitButton.getAttribute('aria-disabled') === 'true') return;

        this.handleErrorMessage();

        this.submitButton.setAttribute('aria-disabled', true);
        this.submitButton.classList.add('loading');
        this.querySelector('.loading__spinner').classList.remove('hidden');

        const config = fetchConfig('javascript');
        config.headers['X-Requested-With'] = 'XMLHttpRequest';
        delete config.headers['Content-Type'];

        const formData = new FormData(this.form);
        if (this.cart) {
          formData.append(
            'sections',
            this.cart.getSectionsToRender().map((section) => section.id)
          );
          formData.append('sections_url', window.location.pathname);
          this.cart.setActiveElement(document.activeElement);
        }
        config.body = formData;

        fetch(`${routes.cart_add_url}`, config)
          .then((response) => response.json())
          .then((response) => {
            if (response.status) {
              publish(PUB_SUB_EVENTS.cartError, {
                source: 'product-form',
                productVariantId: formData.get('id'),
                errors: response.errors || response.description,
                message: response.message,
              });
              this.handleErrorMessage(response.description);

              const soldOutMessage = this.submitButton.querySelector('.sold-out-message');
              if (!soldOutMessage) return;
              this.submitButton.setAttribute('aria-disabled', true);
              this.submitButton.querySelector('span').classList.add('hidden');
              soldOutMessage.classList.remove('hidden');
              this.error = true;
              return;
            } else if (!this.cart) {
              window.location = window.routes.cart_url;
              return;
            }

            if (!this.error)
              publish(PUB_SUB_EVENTS.cartUpdate, {
                source: 'product-form',
                productVariantId: formData.get('id'),
                cartData: response,
              });
            this.error = false;
            const quickAddModal = this.closest('quick-add-modal');
            if (quickAddModal) {
              document.body.addEventListener(
                'modalClosed',
                () => {
                  setTimeout(() => {
                    this.cart.renderContents(response);
                  });
                },
                { once: true }
              );
              quickAddModal.hide(true);
            } else {
              this.cart.renderContents(response);
            }
          })
          .catch((e) => {
            console.error(e);
          })
          .finally(() => {
            this.submitButton.classList.remove('loading');
            if (this.cart && this.cart.classList.contains('is-empty')) this.cart.classList.remove('is-empty');
            if (!this.error) this.submitButton.removeAttribute('aria-disabled');
            this.querySelector('.loading__spinner').classList.add('hidden');
            var added_variant = formData.get('id');
            let findvariantobj = allvariants.find(currentvariant => currentvariant.variantid === added_variant);
            if(findvariantobj !== undefined)
            {
              var giftvariantid = findvariantobj.freegiftid;
              var item = {};
              var this_cart = document.querySelector('cart-notification') || document.querySelector('cart-drawer');
              item.id = giftvariantid;
              item.quantity =1;
              item.sections = this_cart.getSectionsToRender().map((section) => section.id);
              var data = item;
              var xhr = new XMLHttpRequest();
              xhr.open('POST', '/cart/add.js', true);
              xhr.setRequestHeader('Content-Type', 'application/json');
              xhr.onload = function() {
              if (xhr.status >= 200 && xhr.status < 300) {
              var response = JSON.parse(xhr.responseText);
              this_cart.renderContents(response);
              console.log("gift item added");
              } else {
              console.error('Request failed with status', xhr.status);
              }
              };
              xhr.onerror = function() {
              console.error('Request failed');
              };
              xhr.send(JSON.stringify(data));
            }
          });
      }

      handleErrorMessage(errorMessage = false) {
        if (this.hideErrors) return;

        this.errorMessageWrapper =
          this.errorMessageWrapper || this.querySelector('.product-form__error-message-wrapper');
        if (!this.errorMessageWrapper) return;
        this.errorMessage = this.errorMessage || this.errorMessageWrapper.querySelector('.product-form__error-message');

        this.errorMessageWrapper.toggleAttribute('hidden', !errorMessage);

        if (errorMessage) {
          this.errorMessage.textContent = errorMessage;
        }
      }
    }
  );
}


document.getElementById('custom-size-select').addEventListener('change', function() {
  var value = this.value;
  var elementMainBtn = document.querySelector('button[data-main-button]');
  var elementCopyBtn = document.querySelector('button[data-copy-button]');
  var sizeRadio = document.querySelector('label[data-value="'+value+'"]');
  if(value == "") 
  {
    if (elementMainBtn) {
    elementMainBtn.classList.add('hide');
    }
    if (elementCopyBtn && elementCopyBtn.classList.contains('hide')) {
    elementCopyBtn.classList.remove('hide');
    }
  }
  else
  { 
    if (elementCopyBtn) {
    elementCopyBtn.classList.add('hide');
    }
    if (elementMainBtn && elementMainBtn.classList.contains('hide')) {
    elementMainBtn.classList.remove('hide');
    }
  }
  if(sizeRadio) {
    sizeRadio.click();
  }
});