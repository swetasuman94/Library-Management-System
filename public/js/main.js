$('document').ready(function() {

    $("#bookSearchForm #search").click(function() {
        $("#panel-content").html("<h3 class = 'loader'>Loading...</h3>");
        var keyword = $("#searchText").val();
        $("#next-page")[0].dataset.offset = 0;
        localStorage.setItem('search-keyword', keyword);
		$.get('/books/' + keyword + "/0", function(data){
            $("#panel-content").html(data);
            var count = $(".book-container")[0].dataset.total;
            if ( count > 10 ) {
                $("#next-page")[0].dataset.count = count;
                $("#next-page").show();
            }
		});
		return false;
    });
    
    $("#next-page").click(function(){
        var keyword = localStorage.getItem('search-keyword');
        var offset = parseInt($("#next-page")[0].dataset.offset) + 1;
        $("#panel-content").html("<h3 class = 'loader'>Loading...</h3>");
        $.get('/books/' + keyword + "/" + offset * 10, function(data){
            $("#panel-content").html(data);
        });
        $("#prev-page").show();
        $("#next-page")[0].dataset.offset = offset;
        $("#prev-page")[0].disabled = false;
        if ( (offset + 1) * 10 > $("#next-page")[0].dataset.count ) {
            $("#next-page")[0].disabled = true;
        }
    });

    $("#prev-page").click(function(){
        var keyword = localStorage.getItem('search-keyword');
        var offset = parseInt($("#next-page")[0].dataset.offset) - 1;
        $("#panel-content").html("<h3 class = 'loader'>Loading...</h3>");
        $.get('/books/' + keyword + "/" + offset * 10, function(data){
            $("#panel-content").html(data);
        });
        $("#next-page")[0].disabled = false;
        $("#next-page")[0].dataset.offset = offset;
        if (offset == 0 ) {
            $("#prev-page")[0].disabled = true;
        }
    });
    $("#panel-content").on('click', 'button', function(){
        
        var isbn = $(this).data('isbn');
        $(".popup-container.checkout .isbnCheckout").val(isbn);
        $(".popup-container.checkout").css('display', 'block');
        $(this).parents(".book-container").addClass("selected");        
    });

    $("#checkoutSubmit").click(function(){
        var formvalues = $('#bookCheckoutForm').serialize();
        $.post("/checkout/book/", formvalues, function(data){
            $(".popup-container").hide();
            if ( data != "Book limit for User is 3." ) {
                $(".selected .green").text("Not Available");
                $(".selected .green").removeClass("green").addClass("red");
                $(".selected").removeClass("selected");
            }
            
            alert(data);
		});
        
        return false;
    });

    $("#bookCheckoutForm button#cancel").click(function(){
        $(".popup-container.checkout").css('display', 'none');
        $(".selected").removeClass("selected");
        return false;
    });

    $('#addBorrowerForm').submit(function() {
        var formvalues = $('#addBorrowerForm').serialize();
        $.post("/borrower/add/", formvalues, function(data){
            $(".popup-container.error").show();
            $(".popup-container.error h3").text(data);
            setTimeout(function(){
				$(".popup-container.error").hide();
			}, 5000);
		});

        return false;
    });

    $("#checkinSearchForm #search").click(function(){
        $("#checkin-panel-content").html("<h3 class = 'loader'>Loading...</h3>");
        var keyword = $("#searchText").val();
		$.get('/searchCheckedInBooks/' + keyword, function(data){
			$("#checkin-panel-content").html(data);
		});
		return false;
    });

    $("#checkin-panel-content").on('click', 'button', function(){
        var loanObj = {};
        loanObj.loanid = $(this).data('loanid');
        loanObj.chkin = 1;
        loanObj.pay = 0;
        var ele = $(this);
        if ($(this).attr('id') == "chkinPay" ) {
            loanObj.pay = 1;
        }
        $.post("/checkin/book/", loanObj, function(data){
            
            $(".popup-container.checkin").css('display', 'block');
            ele.parents(".book-container").fadeOut();

            setTimeout(function(){
                $(".popup-container.checkin").hide();
            }, 2000);
		});
    });

    $("#updateFine").on('click', function() {
        $.get("/updatefine", function(data){
            $(".popup-container.fines h3").text("Updated Fines in Database");
            $(".popup-container.fines").css('display', 'block');
            getFineData(0);
            setTimeout(function(){
                $(".popup-container.fines").hide();
            }, 2000);
        });
    });      

    function getFineData(flag) {
        $.get("/fines/" + flag, function(data){
            $(".table-container").html(data);
        });
    }
    if ( location.pathname == "/fines") {
        getFineData(0);
    }


    $(".filterToggle").click(function(){
        var flag = $(this).attr('id');
        if ( !$(this).hasClass("active") ) {
            $(".filterToggle").toggleClass('active');
            getFineData(flag);
        }
        
        return false;
    });

    $(".table-container").on('click', 'button', function(){
        var obj = {};
        obj.cardid = $(this).data('cardid');

        $.post("/checkforbooks/", obj, function(data){
            $(".popup-container.fines h3").text(data);
            $(".popup-container.fines").css('display', 'block');
            getFineData(0);
            setTimeout(function(){
                $(".popup-container.fines").hide();
            }, 2000);
		});
    });
});
