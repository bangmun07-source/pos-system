if(
"serviceWorker" in navigator
){

navigator.serviceWorker.register(
"/sw.js"
);

}

function loadIngredientStockAlertTemplate(){

  const template =
    document.getElementById(
      "ingredientStockAlertTemplate"
    );


  if(!template) return;


  if(
    document.getElementById(
      "ingredientStockAlertModal"
    )
  ){
    return;
  }


  document.body.appendChild(
    template.content.cloneNode(true)
  );

}
