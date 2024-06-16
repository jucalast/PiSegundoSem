import { loadChapasData } from "./chapasTable.js";
import { loadChapasCards } from "./chapaCards.js";
/* import { loadItemsData } from "./itemsTable.js";
import { loadItemsCards } from "./itemCards.js"; */

export class DashboardController {
  initializeChapas() {
    var ctx1 = document.getElementById("myChart1").getContext("2d");
    var ctx2 = document.getElementById("myChart2").getContext("2d");
    var ctx3 = document.getElementById("myChart3").getContext("2d");

    loadChapasData(ctx1, ctx2, ctx3);
    loadChapasCards();

    $("#chartCarousel").on("slid.bs.carousel", function () {
      var currentIndex = $(".carousel-item.active").index();
      $(".carousel-indicators li").removeClass("active");
      $(".carousel-indicators li").eq(currentIndex).addClass("active");
    });

    $("#myChart1, #myChart2, #myChart3").mouseenter(function () {
      $("#chartCarousel").carousel("pause");
    });

    $("#myChart1, #myChart2, #myChart3").mouseleave(function () {
      $("#chartCarousel").carousel("cycle");
    });
  }

/*   initializeItems() {
    var ctx1 = document.getElementById("myChart1").getContext("2d");
    var ctx2 = document.getElementById("myChart2").getContext("2d");
    var ctx3 = document.getElementById("myChart3").getContext("2d");

    loadItemsData(ctx1, ctx2, ctx3);
    loadItemsCards();

    // Rest of the code...
  } */
}