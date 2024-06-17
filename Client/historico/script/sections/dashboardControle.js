import { loadChapasData } from "./chapasTable.js";
import { loadChapasCards } from "./chapaCards.js";
/* import { loadItemsData } from "./itemsTable.js";
import { loadItemsCards } from "./itemCards.js"; */

export class DashboardController {
    initializeChapas() {
        $('#items-layout').hide();
        $('#chapas-layout').show();

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

    initializeItems() {
        $('#chapas-layout').hide();
        $('#items-layout').show();

        var ctx = document.getElementById("itemsChart").getContext("2d");

        // Initialize the chart, table, and cards for items section
        // loadItemsData(ctx);
        // loadItemsCards();

        // Example:
        // var myChart = new Chart(ctx, {
        //     type: 'bar',
        //     data: {
        //         labels: ['Red', 'Blue', 'Yellow', 'Green', 'Purple', 'Orange'],
        //         datasets: [{
        //             label: '# of Votes',
        //             data: [12, 19, 3, 5, 2, 3],
        //             backgroundColor: [
        //                 'rgba(255, 99, 132, 0.2)',
        //                 'rgba(54, 162, 235, 0.2)',
        //                 'rgba(255, 206, 86, 0.2)',
        //                 'rgba(75, 192, 192, 0.2)',
        //                 'rgba(153, 102, 255, 0.2)',
        //                 'rgba(255, 159, 64, 0.2)'
        //             ],
        //             borderColor: [
        //                 'rgba(255, 99, 132, 1)',
        //                 'rgba(54, 162, 235, 1)',
        //                 'rgba(255, 206, 86, 1)',
        //                 'rgba(75, 192, 192, 1)',
        //                 'rgba(153, 102, 255, 1)',
        //                 'rgba(255, 159, 64, 1)'
        //             ],
        //             borderWidth: 1
        //         }]
        //     },
        //     options: {
        //         scales: {
        //             y: {
        //                 beginAtZero: true
        //             }
        //         }
        //     }
        // });
    }
}

$(document).ready(function () {
    const dashboardController = new DashboardController();

    $('aside .nav-link').click(function() {
        var section = $(this).data('section');

        console.log('Clicked on ' + section);

        if (section === 'chapas') {
            dashboardController.initializeChapas();
        } else if (section === 'items') {
            dashboardController.initializeItems();
        } else if (section === 'máquinas') {
            // Initialize the Máquinas section
        } else if (section === 'usuários') {
            // Initialize the Usuários section
        }
    });

    // Initialize the Chapas section by default
    dashboardController.initializeChapas();
});
